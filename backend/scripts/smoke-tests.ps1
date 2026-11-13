#requires -Version 7.0
<#
.SYNOPSIS
  Manual end-to-end MVP smoke checks against a DISPOSABLE local Kia Blog stack.

.DESCRIPTION
  Exercises the live Nest API with real HTTP calls. It never starts services and
  never touches production. Run only against a disposable PostgreSQL database.

  Creates data: a USER, an ADMIN-authored AUTHOR, a category, a published post
  (AUTHOR-owned), a comment, a bookmark, and finally deactivates that AUTHOR.
  Deactivation is intentionally irreversible for this run; use a throwaway DB.

  Tokens and passwords are never printed. Expected Persian UI wording for the
  corresponding frontend states is documented in docs/INTEGRATION_SMOKE_TESTS.md.

.PARAMETER BaseUrl
  Nest origin, e.g. http://localhost:3000 (env SMOKE_BASE_URL).

.PARAMETER AdminEmail / AdminPassword
  Existing ADMIN account (env SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD).
  If absent, only the public/auth core checks run.

.PARAMETER IncludeExternal
  Also upload an image (requires CLOUDINARY_* configured for Nest).

.EXAMPLE
  pwsh -File backend/scripts/smoke-tests.ps1 -BaseUrl http://localhost:3000 `
    -AdminEmail admin@example.test -AdminPassword '<from secret store>'
#>
[CmdletBinding()]
param(
  [string]$BaseUrl = $(if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { 'http://localhost:3000' }),
  [string]$AdminEmail = $env:SMOKE_ADMIN_EMAIL,
  [string]$AdminPassword = $env:SMOKE_ADMIN_PASSWORD,
  [switch]$IncludeExternal,
  [string]$ImagePath = (Join-Path $PSScriptRoot '../../frontend/public/social/linkedin.png')
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$script:Failures = 0
$run = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
# Disposable-run credentials only; the password meets the backend policy.
$runPassword = "Smoke1!$run"

function Step([string]$name) {
  Write-Host "`n== $name ==" -ForegroundColor Cyan
}

function Check([string]$label, [bool]$condition, [string]$detail = '') {
  if ($condition) {
    Write-Host "PASS  $label" -ForegroundColor Green
  } else {
    Write-Host "FAIL  $label $detail" -ForegroundColor Red
    $script:Failures++
  }
}

function Invoke-Smoke {
  param(
    [Parameter(Mandatory)][string]$Method,
    [Parameter(Mandatory)][string]$Path,
    [object]$Body,
    [string]$Token,
    [System.Collections.IDictionary]$Form
  )
  $headers = @{ Accept = 'application/json' }
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  $params = @{
    Method             = $Method
    Uri                = "$BaseUrl$Path"
    Headers            = $headers
    SkipHttpErrorCheck = $true
    StatusCodeVariable = 'status'
    TimeoutSec         = 30
  }
  if ($null -ne $Body) {
    $params.ContentType = 'application/json'
    $params.Body = ($Body | ConvertTo-Json -Depth 12 -Compress)
  }
  if ($Form) { $params.Form = $Form }
  $response = Invoke-WebRequest @params
  $data = $null
  if ($response.Content) {
    try { $data = $response.Content | ConvertFrom-Json } catch { $data = $null }
  }
  # Response bodies are parsed but never retained for diagnostics; auth bodies
  # can contain access/refresh tokens and must never reach the console.
  [pscustomobject]@{ Status = [int]$status; Data = $data }
}

function Expect([string]$label, $result, [int]$status) {
  # Status-only diagnostics: never print response bodies.
  Check "$label -> HTTP $status" ($result.Status -eq $status) "(expected $status, got $($result.Status))"
  return $result
}

function Login([string]$email, [string]$password) {
  Invoke-Smoke -Method POST -Path '/auth/login' -Body @{ email = $email; password = $password }
}

Write-Host "Kia Blog smoke checks against $BaseUrl (run $run)" -ForegroundColor Yellow
Write-Host 'Safety: disposable local database only. No production resources.' -ForegroundColor Yellow

Step '0. Health and migration prerequisite'
Expect 'GET /health' (Invoke-Smoke -Method GET -Path '/health') 200 | Out-Null
Write-Host 'Before running, run "npx prisma migrate status" in backend/ and confirm it is up to date.'

Step '1. Email registration and session lifecycle'
$email = "smoke-user-$run@example.test"
$registered = Expect 'POST /auth/register' (Invoke-Smoke -Method POST -Path '/auth/register' -Body @{
    email = $email; password = $runPassword; confirmPassword = $runPassword
  }) 201
Check 'registration returns no tokens' ($null -eq $registered.Data.accessToken -and $null -eq $registered.Data.refreshToken)

$userLogin = Expect 'POST /auth/login (USER)' (Login $email $runPassword) 200
$userToken = $userLogin.Data.accessToken
$userRefresh = $userLogin.Data.refreshToken
Check 'login returns USER role' ($userLogin.Data.user.role.name -eq 'USER')
Expect 'GET /auth/me (USER)' (Invoke-Smoke -Method GET -Path '/auth/me' -Token $userToken) 200 | Out-Null
Expect 'POST /auth/refresh' (Invoke-Smoke -Method POST -Path '/auth/refresh' -Body @{ refreshToken = $userRefresh }) 200 | Out-Null
Expect 'POST /auth/logout' (Invoke-Smoke -Method POST -Path '/auth/logout' -Body @{ refreshToken = $userRefresh }) 200 | Out-Null
# Negative auth checks print only the status code: an unexpected success body
# would contain fresh credentials.
Expect 'refresh after logout is revoked' (Invoke-Smoke -Method POST -Path '/auth/refresh' -Body @{ refreshToken = $userRefresh }) 401 | Out-Null

if (-not $AdminEmail -or -not $AdminPassword) {
  Write-Host "`nAdmin credentials not supplied; stopping after public/auth checks." -ForegroundColor Yellow
  Write-Host 'Set SMOKE_ADMIN_EMAIL/SMOKE_ADMIN_PASSWORD (see docs/INTEGRATION_SMOKE_TESTS.md).'
  if ($script:Failures -gt 0) { exit 1 }
  exit 0
}

Step '2. ADMIN session and taxonomy conflicts'
$adminLogin = Expect 'POST /auth/login (ADMIN)' (Login $AdminEmail $AdminPassword) 200
$adminToken = $adminLogin.Data.accessToken

$categoryName = "Smoke Category $run"
$category = Expect 'POST /categories (unique name)' (Invoke-Smoke -Method POST -Path '/categories' -Token $adminToken -Body @{ name = $categoryName }) 201
$categoryId = $category.Data.id
Expect 'POST /categories duplicate -> 409' (Invoke-Smoke -Method POST -Path '/categories' -Token $adminToken -Body @{ name = $categoryName }) 409 | Out-Null
Expect 'POST /categories blank -> 400' (Invoke-Smoke -Method POST -Path '/categories' -Token $adminToken -Body @{ name = '   ' }) 400 | Out-Null
$unused = Expect 'POST /categories (unused)' (Invoke-Smoke -Method POST -Path '/categories' -Token $adminToken -Body @{ name = "Smoke Unused $run" }) 201
Expect 'DELETE unreferenced category' (Invoke-Smoke -Method DELETE -Path "/categories/$($unused.Data.id)" -Token $adminToken) 200 | Out-Null
Expect 'DELETE missing category -> 404' (Invoke-Smoke -Method DELETE -Path '/categories/00000000-0000-4000-8000-000000000000' -Token $adminToken) 404 | Out-Null

Step '3. ADMIN creates an AUTHOR and the AUTHOR logs in'
$authorEmail = "smoke-author-$run@example.test"
$author = Expect 'POST /admin/authors' (Invoke-Smoke -Method POST -Path '/admin/authors' -Token $adminToken -Body @{
    name = 'Smoke Author'; email = $authorEmail; password = $runPassword
  }) 201
Check 'created account is AUTHOR' ($author.Data.role.name -eq 'AUTHOR')
$authorLogin = Expect 'POST /auth/login (AUTHOR)' (Login $authorEmail $runPassword) 200
$authorToken = $authorLogin.Data.accessToken

Step '4. Optional Cloudinary image upload'
if ($IncludeExternal) {
  if (-not (Test-Path $ImagePath)) {
    Check "image file exists ($ImagePath)" $false
  } else {
    $upload = Expect 'POST /media/images' (Invoke-Smoke -Method POST -Path '/media/images' -Token $authorToken -Form @{ file = Get-Item $ImagePath }) 201
    Check 'upload returns a safe https URL' ($upload.Data.url -like 'https://*res.cloudinary.com/*')
  }
} else {
  Write-Host 'SKIP  image upload (pass -IncludeExternal; requires CLOUDINARY_* configured).' -ForegroundColor Yellow
}

Step '5. Publish and public read cycle'
$title = "Smoke Published $run"
$post = Expect 'POST /posts (PUBLISHED with category)' (Invoke-Smoke -Method POST -Path '/posts' -Token $authorToken -Body @{
    title = $title; content = "Smoke body $run"; status = 'PUBLISHED'; categoryIds = @($categoryId); tagIds = @()
  }) 201
$postId = $post.Data.id
$slug = $post.Data.slug
Expect 'GET /posts/:slug public detail' (Invoke-Smoke -Method GET -Path "/posts/$([uri]::EscapeDataString($slug))") 200 | Out-Null
$feed = Expect 'GET /posts?search=... public feed' (Invoke-Smoke -Method GET -Path "/posts?page=1&limit=10&sort=newest&search=$([uri]::EscapeDataString($title))") 200
Check 'feed contains the published post' (@($feed.Data.data | Where-Object { $_.id -eq $postId }).Count -eq 1)

Step '6. Comment moderation, stale version, public visibility'
$commentText = "Smoke comment $run"
$comment = Expect 'POST /posts/:id/comments (PENDING)' (Invoke-Smoke -Method POST -Path "/posts/$postId/comments" -Token $userToken -Body @{ content = $commentText }) 201
$commentId = $comment.Data.id
Check 'new comment is PENDING' ($comment.Data.status -eq 'PENDING')
$publicBefore = Expect 'GET public comments' (Invoke-Smoke -Method GET -Path "/posts/$postId/comments") 200
Check 'PENDING text is not public' (@($publicBefore.Data | Where-Object { $_.content -eq $commentText }).Count -eq 0)

$inventory = Expect 'GET /admin/comments' (Invoke-Smoke -Method GET -Path '/admin/comments?page=1&limit=50' -Token $adminToken) 200
$row = $inventory.Data.data | Where-Object { $_.id -eq $commentId } | Select-Object -First 1
Check 'admin inventory exposes the version' ($null -ne $row -and $row.version -ge 1)
$version = $row.version
Expect 'PATCH approve' (Invoke-Smoke -Method PATCH -Path "/admin/comments/$commentId/approve" -Token $adminToken -Body @{ version = $version }) 200 | Out-Null
Expect 'PATCH approve stale version -> 409' (Invoke-Smoke -Method PATCH -Path "/admin/comments/$commentId/approve" -Token $adminToken -Body @{ version = $version }) 409 | Out-Null
$publicAfter = Expect 'GET public comments after approval' (Invoke-Smoke -Method GET -Path "/posts/$postId/comments") 200
Check 'APPROVED text is public' (@($publicAfter.Data | Where-Object { $_.content -eq $commentText }).Count -eq 1)

Step '7. Bookmarks are idempotent'
Expect 'POST bookmark' (Invoke-Smoke -Method POST -Path "/posts/$postId/bookmark" -Token $userToken) 201 | Out-Null
$saved = Expect 'GET /bookmarks' (Invoke-Smoke -Method GET -Path '/bookmarks' -Token $userToken) 200
Check 'saved list contains the post' (@($saved.Data | Where-Object { $_.postId -eq $postId }).Count -eq 1)
Expect 'DELETE bookmark' (Invoke-Smoke -Method DELETE -Path "/posts/$postId/bookmark" -Token $userToken) 200 | Out-Null
Expect 'DELETE bookmark again (idempotent)' (Invoke-Smoke -Method DELETE -Path "/posts/$postId/bookmark" -Token $userToken) 200 | Out-Null

Step '8. Author deactivation preserves content'
Expect 'PATCH deactivate AUTHOR' (Invoke-Smoke -Method PATCH -Path "/admin/authors/$($author.Data.id)/deactivate" -Token $adminToken) 200 | Out-Null
# Redacted negative check: status only, so a regression cannot echo credentials.
Expect 'deactivated AUTHOR login -> 401' (Login $authorEmail $runPassword) 401 | Out-Null
Expect 'deactivated AUTHOR access token -> 401' (Invoke-Smoke -Method GET -Path '/auth/me' -Token $authorToken) 401 | Out-Null
Expect 'published post remains public' (Invoke-Smoke -Method GET -Path "/posts/$([uri]::EscapeDataString($slug))") 200 | Out-Null

Step '9. Referenced taxonomy cannot be deleted'
Expect 'DELETE referenced category -> 409' (Invoke-Smoke -Method DELETE -Path "/categories/$categoryId" -Token $adminToken) 409 | Out-Null

Write-Host "`nResult: $($script:Failures) failed check(s)." -ForegroundColor $(if ($script:Failures) { 'Red' } else { 'Green' })
Write-Host 'Data was created; use a disposable database. See docs/INTEGRATION_SMOKE_TESTS.md.'
if ($script:Failures -gt 0) { exit 1 }
