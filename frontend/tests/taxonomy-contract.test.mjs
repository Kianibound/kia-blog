import assert from "node:assert/strict";
import test from "node:test";
import {
  createTaxonomyFailure,
  deleteTaxonomyFailure,
  isTaxonomyKind,
  parseTaxonomyList,
  parseTaxonomyRecord,
  taxonomyNameError,
  taxonomyPath,
} from "../src/lib/taxonomy-contract.ts";

const category = {
  id: "20000000-0000-4000-8000-000000000001",
  name: "توسعهٔ وب",
  slug: "web",
  createdAt: "2026-03-19T12:00:00.000Z",
  updatedAt: "2026-03-19T12:00:00.000Z",
};

test("taxonomy parsing keeps only the public id, name and slug fields", () => {
  assert.deepEqual(parseTaxonomyRecord(category), {
    id: category.id,
    name: "توسعهٔ وب",
    slug: "web",
  });
  // Nest's strict slugifier can legitimately produce an empty slug.
  assert.deepEqual(parseTaxonomyRecord({ id: "t-1", name: "یادگیری", slug: "" }), {
    id: "t-1",
    name: "یادگیری",
    slug: "",
  });
  assert.equal(parseTaxonomyRecord({ ...category, id: "" }), null);
  assert.equal(parseTaxonomyRecord({ ...category, name: "  " }), null);
  assert.equal(parseTaxonomyRecord({ ...category, slug: 5 }), null);
  assert.equal(parseTaxonomyRecord(null), null);
});

test("taxonomy lists reject the whole payload when one row is malformed", () => {
  assert.deepEqual(
    parseTaxonomyList([category]).map((item) => item.slug),
    ["web"],
  );
  assert.deepEqual(parseTaxonomyList([]), []);
  assert.equal(parseTaxonomyList([category, { id: 1, name: "x", slug: "x" }]), null);
  assert.equal(parseTaxonomyList({ data: [category] }), null);
});

test("names are trimmed requirements, matching backend normalization", () => {
  assert.equal(taxonomyNameError("  وب  "), null);
  assert.equal(taxonomyNameError("   "), "required");
  assert.equal(taxonomyNameError(""), "required");
  assert.equal(taxonomyNameError(undefined), "required");
  assert.equal(taxonomyNameError(7), "required");
});

test("kind guards and paths cannot be supplied by an arbitrary route", () => {
  assert.equal(isTaxonomyKind("categories"), true);
  assert.equal(isTaxonomyKind("tags"), true);
  assert.equal(isTaxonomyKind("users"), false);
  assert.equal(taxonomyPath("categories"), "/categories");
  assert.equal(taxonomyPath("tags"), "/tags");
});

test("create failures separate duplicate/slug collisions from other statuses", () => {
  assert.equal(createTaxonomyFailure(409), "duplicate");
  assert.equal(createTaxonomyFailure(400), "validation");
  assert.equal(createTaxonomyFailure(422), "validation");
  assert.equal(createTaxonomyFailure(401), "unauthorized");
  assert.equal(createTaxonomyFailure(403), "forbidden");
  assert.equal(createTaxonomyFailure(404), "not-found");
  assert.equal(createTaxonomyFailure(503), "unavailable");
  assert.equal(createTaxonomyFailure(418), "protocol");
});

test("delete failures treat 409 as an in-use reference, not a duplicate", () => {
  assert.equal(deleteTaxonomyFailure(409), "in-use");
  assert.equal(deleteTaxonomyFailure(404), "not-found");
  assert.equal(deleteTaxonomyFailure(401), "unauthorized");
  assert.equal(deleteTaxonomyFailure(403), "forbidden");
  assert.equal(deleteTaxonomyFailure(400), "validation");
  assert.equal(deleteTaxonomyFailure(503), "unavailable");
});
