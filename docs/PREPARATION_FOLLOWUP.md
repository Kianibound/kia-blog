# نتیجهٔ تکمیل تنظیمات و بررسی موانع

تاریخ بررسی: ۲۰۲۶-۱۰-۲۳. برنچ: `chore/frontend-foundation`.
این گزارش وضعیت فعلی را جایگزین بخش‌های قدیمی مربوط به setup و تشخیص خطای MCP می‌کند.
کد بک‌اند، فیچرهای فرانت، production و دیتابیس تغییر نکردند؛ `/wayfinder` اجرا نشد.

## ۱. تنظیمات Matt Pocock

دستور کاربر برای تکمیل پیش‌نویس، تأیید توصیه‌های آن شامل GitHub Issues، labelهای
پیش‌فرض و فایل ریشهٔ `AGENTS.md` محسوب شد. درخواست تأیید تکراری مطرح نشد.

فایل‌های فعال:

- `AGENTS.md`: مسیر راهنمای اسکیل‌ها و مرزهای تأیید تغییرات.
- `docs/agents/issue-tracker.md`: GitHub Issues همین مخزن؛ بر اساس template نصب‌شده.
- `docs/agents/triage-labels.md`: نگاشت پنج label پیش‌فرض.
- `docs/agents/domain.md`: یک context، با حفظ `backend/GLOSSARY.md` به‌عنوان مرجع.

این تنظیمات برای `to-spec`، `to-tickets`، `triage`، `wayfinder` و اسکیل‌های مصرف‌کنندهٔ
domain docs قابل استفاده‌اند. فایل‌های VibeFarsi در frontend دست‌نخورده باقی ماندند.
می‌توان تنظیمات `docs/agents/*.md` را مستقیماً ویرایش کرد.

**بخش محلی کامل است؛ چهار label روی GitHub هنوز ساخته نشده‌اند.** خواندن عمومی
labelهای مخزن موفق بود: `wontfix` وجود دارد؛ `needs-triage`، `needs-info`،
`ready-for-agent` و `ready-for-human` وجود ندارند. ابزار GitHub متصل عملیات ساخت label
ندارد؛ gh نصب نیست و Git Credential Manager در sandbox credential غیرتعاملی ارائه
نکرد. تلاش مرورگر نیز به تب قابل‌کنترل نرسید؛ هیچ تغییر remote انجام نشد.

اسکریپت idempotent زیر آماده است؛ در محیطی با gh احراز هویت‌شده اجرا می‌شود و labelهای
موجود را حفظ می‌کند. در این جلسه صرفاً syntax آن بررسی شد، اجرای remote موفق نبوده:

```powershell
./scripts/setup-triage-labels.ps1
```

هیچ Issue، تیکت اجرایی یا نقشهٔ wayfinder ساخته نشد.

## ۲. علت خطای Codebase Memory

نسخهٔ رسمی v0.12.1 و سورس همان tag بررسی شد؛ commit سورس
`a7158ac2f48ca646b4527341b76f930f2aeff87e` است.

مسیر خطا در سورس:

1. `src/main.c`: قبل از اجرای ابزار، `cbm_runtime_settings_init` فراخوانی می‌شود.
2. `src/cli/runtime_settings.c`: ابتدا `canonical_cache_path` اجرا می‌شود.
3. این تابع `cbm_daemon_ipc_private_directory_secure` را صدا می‌زند.
4. در Windows، `src/daemon/ipc.c` تمام والدهای مسیر را با `CreateFileW` و دسترسی
   `READ_CONTROL | FILE_READ_ATTRIBUTES` باز می‌کند و مالکیت/ACL را بررسی می‌کند.

شواهد این میزبان:

| بررسی | نتیجه |
|---|---|
| حساب اجرای فرمان | حساب محدود sandbox؛ متفاوت از صاحب پروفایل کاربر |
| بازکردن `C:\Users` با همان دسترسی/flagهای تابع | موفق |
| بازکردن `C:\Users\Ehsan` با همان دسترسی/flagها | Windows error 5: Access denied |
| ACL مسیرهای پایین‌تر | مالک پروفایل و مجوزهای گروه sandbox؛ مالکیت صرفاً حساب اجرا نیست |
| cache جدید و خالی در TEMP | همان خطا؛ `_config.db` اصلاً ایجاد نشده |
| ساخت مسیر مستقل زیر `C:\workspace` | Access denied؛ جایگزین قابل استفاده نشد |

**علت قابل اثبات، ناسازگاری دسترسی مسیر پروفایل با کنترل امنیتی cache در اجرای sandbox
است.** حداقل یکی از فراخوانی‌های ضروری برنامه روی والد پروفایل قطعاً با error 5
شکست می‌خورد. ایجاد cache قابل‌نوشتن در زیر همان پروفایل این مانع والد را رفع نمی‌کند.
شواهدی از خرابی graph یا دیتابیس تنظیمات نداریم؛ آزمایش cache خالی هم شکست خورد.

بدون تغییر سیاست دسترسی میزبان یا اجرای بیرون از این sandbox، راه‌حل تأییدشده‌ای در
این جلسه پیدا نشد. ACL پروفایل، مالکیت پوشه‌های کاربر، کنترل‌های امنیتی برنامه و
تنظیمات sandbox تغییر داده نشدند. نسخهٔ قدیمی‌تر یا binary با کنترل امنیتی حذف‌شده
نیز به‌عنوان راه‌حل استفاده نشد.

راه عملی: اجرای رسمی MCP در یک محیط توسعهٔ محلی با حساب معمول کاربر و cache/runtime
خصوصی و قابل‌اعتبارسنجی؛ یا WSL با cache در filesystem لینوکسی، اگر از قبل در دسترس
باشد. نصب یا تغییر تنظیمات WSL انجام نشده است. پس از رفع محیط باید ایندکس کل مخزن،
query گراف و query پس از restart آزمایش شوند؛ دستورها در `DEVELOPMENT_TOOLS.md` هستند.

**وضعیت فعلی: indexing، graph query و persistence همچنان تأیید نشده‌اند.** حتی موفقیت
CLI در محیط دیگر، به‌تنهایی ابزار را به catalog همین Work اضافه نمی‌کند.

منابع رسمی:

- https://github.com/DeusData/codebase-memory-mcp/blob/v0.12.1/src/cli/runtime_settings.c
- https://github.com/DeusData/codebase-memory-mcp/blob/v0.12.1/src/daemon/ipc.c
- https://github.com/DeusData/codebase-memory-mcp/blob/v0.12.1/docs/CONFIGURATION.md

## ۳. بررسی پنج هشدار امنیتی

اجرای مجدد audit همان پنج finding را نشان داد. این‌ها پنج نقص مستقل نیستند؛ یک
advisory اصلی از زنجیرهٔ زیر به والدها منتقل شده است:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`

| بستهٔ نصب‌شده | نوع هشدار | تصمیم برای این پروژه |
|---|---|---|
| braces 3.0.3 | نقص اصلی: stack exhaustion در الگوهای brace با عمق زیاد | آسیب‌پذیری واقعی dependency؛ وقتی patch معتبر منتشر شد اصلاح شود |
| micromatch 4.0.8 | وابستگی به braces | اصلاح مستقل نیاز ندارد؛ با رفع زنجیره حل می‌شود |
| fast-glob 3.3.1 | وابستگی به micromatch | اصلاح مستقل نیاز ندارد |
| @next/eslint-plugin-next 16.4.2 | وابستگی به fast-glob | فعلاً حفظ نسخهٔ سازگار؛ ارتقای upstream هنگام ارائهٔ اصلاح |
| eslint-config-next 16.4.2 | هشدار منتقل‌شده از plugin | فعلاً حفظ هم‌نسخه با Next؛ downgrade اجباری توصیه نمی‌شود |

advisory رسمی `GHSA-vfj7-8cjw-p6xm` نسخهٔ patched ندارد؛ npm نیز latestِ braces را
3.0.3 اعلام کرد. `audit fix --force` کاهش eslint-config-next به 14.2.35 را پیشنهاد
می‌کند؛ این کار بدون بررسی سازگاری مناسب پروژهٔ Next 16 نیست و انجام نشد.

**ارزیابی دسترس‌پذیری:** هر پنج بسته در lockfile فقط `dev` هستند و
`npm audit --omit=dev` صفر finding گزارش کرد. محل استفادهٔ fast-glob در plugin فعلی
`dist/utils/get-root-dirs.js` است: فقط وقتی `settings.next.rootDir` تنظیم شود، الگوی
آن به glob داده می‌شود. config فعلی چنین تنظیمی ندارد. یک probe موقت روی همان تابع
برای config فعلی صفر فراخوانی glob و برای rootDir صریح یک فراخوانی ثبت کرد. دادهٔ
بازدیدکننده یا محتوای پست به این مسیر داده نمی‌شود.

probe محدود داخل child process برای nested pattern با عمق ۲۰۰۰ و ۴۰۰۰ روی Node این
میزبان crash ایجاد نکرد؛ نمونهٔ طولانی‌تر از سقف ۱۰۰۰۰ کاراکتر با SyntaxError رد شد.
بنابراین exploit/crash را در این میزبان بازتولیدشده نمی‌نامیم؛ این نتیجه advisory
بالادستی را رد نمی‌کند و به معنی اصلاح کتابخانه نیست.

**نتیجه:** اکنون اصلاح اضطراری کد محصول لازم نیست؛ ریسک فعلی مسیر مشخص‌شده پایین و
مربوط به tooling است، اما findingها پنهان/حذف نشده‌اند. config و glob غیرقابل‌اعتماد
را اجرا نکنید؛ اصلاح upstream پیگیری و قبل از افزودن rootDir پویا یا استفادهٔ runtime
از glob دوباره بررسی شود. حذف ruleها، override بی‌مدرک یا patch دستی node_modules
انجام نشد. پنج High به‌تنهایی دلیل فنی کافی برای توقف برنامه‌ریزی فرانت نیستند.

منبع: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

## ۴. دو مشکل بک‌اند و اصلاح حداقلی پیشنهادی

### الف) قرارداد ناقص OpenAPI

`/api-json` همچنان 200 است، اما `components.schemas` خالی است. نمونهٔ request ساخت
پست، `example` دارد؛ schema کامل fieldها و responseهای typed ندارد. پاسخ 200 لیست
پست‌ها و جزئیات پیش‌نویس عمدتاً فقط description است. این نقص با خراب‌بودن صفحهٔ
Swagger فرق دارد؛ routeهای واقعی کار می‌کنند ولی client generator نوع داده را
دقیق به دست نمی‌آورد.

علت در کد: DTOها عمدتاً decorator اعتبارسنجی دارند، plugin اسناد در `nest-cli.json`
فعال نیست، چند `ApiBody` فقط raw example تعریف کرده‌اند و `ApiResponse`ها نوع خروجی
ندارند. TypeScript و نوع استنتاج‌شدهٔ Prisma به‌تنهایی قرارداد runtime تولید نمی‌کنند.

اصلاح پیشنهادی با کمترین اثر رفتاری، ابتدا روی APIهای موردنیاز اولین slice:

1. برای request DTOها `ApiProperty`/`ApiPropertyOptional` صریح اضافه شود، شامل enum،
   آرایه، UUID، required، محدودیت‌های موجود و مثال؛ رفتار validation تغییر نکند.
2. `ApiBody`های example-only به نوع DTO واقعی متصل شوند؛ مثال حفظ شود.
3. response DTOهای مستقل و امن برای Post، taxonomy، author، pagination، auth و error
   تعریف و با `ApiOkResponse`/`ApiCreatedResponse` به route مربوط متصل شوند. شکل‌ها
   باید دقیقاً با response واقعی هر route یکسان باشند، نه یک DTO عمومیِ بزرگ برای همه.
4. خروجی OpenAPI به‌صورت local و بدون اتصال به I/O واقعی بررسی شود: requiredها،
   nullableها، enum، response content و referenceهای معتبر. تست فعلی Swagger فقط
   وجود route/security scheme را می‌سنجد و برای کامل‌بودن قرارداد کافی نیست.

نمونهٔ الگوی پیشنهادی، اجرا نشده:

```ts
@ApiBody({ type: CreatePostDto })
@ApiCreatedResponse({ type: CreatedPostResponseDto })
// POST /posts: همان handler و workflow فعلی
```

نام `CreatedPostResponseDto` در این مثال پیشنهادی است و هنوز در پروژه وجود ندارد.
فعال‌سازی plugin می‌تواند boilerplate را کم کند، اما جای نوع خروجی صریح و بررسی
responseهای Prisma و bodyهای overrideشده را نمی‌گیرد. migration یا route جدید لازم نیست.

**اولویت:** پیش از تکیه بر generated API client لازم است؛ مانع فهم دامنه، طراحی UI
یا integration دستی محدود نیست. رفع‌شدن صرفاً با غیرخالی‌شدن schemas اثبات نمی‌شود.

منابع: https://docs.nestjs.com/openapi/types-and-parameters و
https://docs.nestjs.com/openapi/operations و https://docs.nestjs.com/openapi/cli-plugin

### ب) taxonomy ناقص در جزئیات پیش‌نویس نویسنده

`GET /posts/mine/:id` به `PostQueries.findMineById` می‌رسد؛ query فقط
`include: { author: authorProjection }` دارد. category/tag رابطهٔ Prisma هستند و
در نتیجهٔ scalar بدون include برنمی‌گردند. اما `PATCH /posts/:id` برای تغییر آن‌ها
`categoryIds` و `tagIds` می‌گیرد. بنابراین بعد از reload، editor نمی‌تواند انتخاب‌های
قبلی یک draft را بازیابی کند. route عمومی slug هم draft را عمداً 404 می‌کند و
جایگزین مناسبی نیست؛ lookup ادمین نیز برای AUTHOR مجاز نیست.

حداقل اصلاح در یک محل، بدون route یا migration جدید:

```ts
// در findMineById، به‌جای include فعلی:
include: detailProjection,
```

`detailProjection` همین حالا در همان فایل وجود دارد: author امن و category/tag شامل
`id`، `name` و `slug`. guard و `assertPostAccess` حفظ شوند. تغییر list `/posts/mine`
برای حل reload editor ضروری نیست و باید جداگانه با نیاز UI توجیه شود.

خطر فرانت: نبودن آرایه در response نباید به «آرایهٔ خالیِ انتخاب‌شده توسط کاربر»
تعبیر شود. در update فعلی، omitted یعنی حفظ رابطه‌ها و `[]` یعنی حذف همه؛ ارسال
بی‌دلیل آرایهٔ خالی می‌تواند taxonomy موجود را پاک کند.

اعتبارسنجی لازم پس از تأیید اصلاح: draft متعلق به نویسنده با چند category/tag از
route خودش همهٔ IDها را بدهد؛ نویسندهٔ دیگر 403، مهمان 401، post ناموجود 404 و route
عمومی draft همچنان 404 بماند. همچنین omitted در update رابطه‌ها را حفظ و `[]` آن‌ها
را پاک کند. تست باید query projection را هم بسنجد تا mock بیش‌ازحد کامل، نقص را نپوشاند.

**اولویت:** پیش از editor کامل نویسنده لازم است؛ برای صفحهٔ عمومی خواندن پست مانع نیست.
هیچ‌یک از اصلاحات پیشنهادی این بخش در بک‌اند اعمال نشده‌اند.
