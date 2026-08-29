# App Store Connect — данни за подаване

Копирай оттук в App Store Connect. Всичко е на български (BG-only пуск, ADR-0004).

## Основно

| Поле | Стойност |
| --- | --- |
| Bundle ID | `bg.glovebox.app` |
| SKU | `glovebox-ios` |
| Primary language | **English (U.K.)** — виж бележката отдолу |
| Primary category | Utilities |
| Secondary category | Productivity |
| Age rating | 4+ |
| Price | Free |

> **Защо English (U.K.), а не български:** Apple **не поддържа български** като език за
> метаданни в App Store — няма го в списъка. Default езикът на българския storefront е
> **English (U.K.)**, така че точно него избираме, а в полетата пишем българския текст.
> Така всеки в България вижда описанието на български. Това е обичайната практика за
> пазари, които Apple не локализира.

## Име и подзаглавие

**App Name** (макс. 30 знака) — избраното и вече заведено в App Store Connect:
```
Glovebox: Авто Напомняния
```
(25 знака.) Самò `Glovebox` **е заето** в App Store — имената са глобално уникални. Иконата на
телефона пак изписва „Glovebox": това идва от `expo.name` в `app.json`, не оттук.

**Subtitle** (макс. 30 знака):
```
ГО, винетка и преглед навреме
```

## Ключови думи (макс. 100 знака, със запетаи, без интервали след тях)

```
каско,данък,МПС,застраховка,документи,кола,автомобил,срокове,полица,талон,технически,сервиз,ремонт
```

(98/100 знака.) Apple индексира **името, подзаглавието и ключовите думи поотделно**, затова тук
няма нито една дума, която вече стои в името („Авто", „Напомняния") или в подзаглавието („ГО",
„винетка", „преглед"). Повторена дума не носи нищо — само изяжда от лимита.

## Promotional Text (макс. 170 знака)

```
Забравената гражданска отговорност струва по-скъпо от една глоба. Glovebox помни вместо теб — и ти казва навреме, преди срокът да изтече.
```

## Description

```
Glovebox е жабката на колата ти, само че в телефона.

Всички срокове на автомобила на едно място — гражданска отговорност, каско, винетка,
технически преглед, данък МПС, пожарогасител и обслужване. Виждаш с един поглед кое е
валидно, кое изтича скоро и кое вече е изтекло.

И най-важното: напомняме ти, преди да изтече.

КАКВО ПРАВИ

• Всички срокове на едно място — добавяш кола и услугите към нея, а Glovebox смята статуса
  вместо теб: валидно, изтича скоро или изтекло.
• Напомняния навреме — получаваш известие преди срокът да изтече, за да имаш време да го
  подновиш. Сам избираш колко дни предварително.
• Документи под ръка — качваш полицата, талона или фактурата и ги намираш веднага, когато
  ти потрябват. Съхраняват се защитено и са видими само за теб.
• Разходите ти, ясно — колко харчиш за колата по месеци и по видове разход, включително
  ремонти.
• Няколко коли — семейните автомобили са в един профил.

ЗА КОГО Е

За всеки шофьор в България, който поне веднъж се е сещал за гражданската отговорност в
деня, в който изтича. И за всеки, който кара повече от една кола.

ЗАЩИТА НА ДАННИТЕ

Данните ти са твои. Документите се пазят защитено и не се споделят с трети страни. Можеш
да изтриеш профила си и всичко в него по всяко време, направо от приложението.

Приложението е на български и е направено за българските срокове и документи.
```

## URL-и

| Поле | Стойност |
| --- | --- |
| Privacy Policy URL | `https://www.glovebox.bg/privacy` |
| Support URL | `https://www.glovebox.bg` |
| Marketing URL | `https://www.glovebox.bg` |

## App Review Information

**Sign-In required:** Yes

| Поле | Стойност |
| --- | --- |
| Username | `appreview@glovebox.bg` |
| Password | **не се държи тук** — репото е публично; паролата е в App Store Connect |

> Ако паролата се загуби, ротирай я през Supabase (Authentication → Users → appreview@glovebox.bg
> → Reset password) и я обнови в App Store Connect. Никога не я записвай в този файл.

**Notes** (ревюърите четат английски):
```
WHAT THE APP IS
Glovebox is a private record-keeping and reminder tool for car owners in
Bulgaria. A Bulgarian driver must keep several unrelated obligations valid at
once - Civil Liability insurance, Casco, the road vignette, the annual
roadworthiness inspection, vehicle tax and a valid fire extinguisher. Each has
its own expiry date and its own issuing institution, and letting one lapse is a
fineable offence. The user records each expiry date once; the app derives a
status (valid / expiring soon / expired) and notifies them before it lapses.
Free, no in-app purchases, no subscriptions. Audience: private car owners in
Bulgaria.

TESTED ON
iPhone 14, iOS 26.6.1, via TestFlight.

HOW TO USE IT
Sign in with the demo account above; it holds two vehicles and twelve records so
every state is visible at once. The five tabs, left to right:
1. "Табло" (Dashboard) - the most urgent deadline, plus counts of valid /
   expiring / expired.
2. "Автомобили" (Vehicles) - the demo cars. Tap one for its records, colour
   coded: green = valid, amber = expiring soon, red = expired.
3. "Документи" (Documents) - files attached to a record (any PDF or image).
4. "Напомняния" (Reminders) - days before expiry to be notified, per type.
5. "Профил" (Profile) - name, password, sign out, account deletion.

ACCOUNT DELETION (Guideline 5.1.1(v))
Open "Профил" (rightmost tab), scroll to the bottom, tap "Изтрий акаунта" in the
red-outlined section. It confirms twice, then permanently deletes the account,
all vehicles, records and uploaded files.

EXTERNAL SERVICES
- Supabase: authentication (e-mail/password, Sign in with Apple, Google), the
  database, and encrypted storage for uploaded documents. The only third-party
  SDK in the bundle.
- Sign in with Apple and Google OAuth, both through Supabase.
- Expo Push Notification Service: reminder notifications.
- Resend: reminder e-mails, sent from our server, not from the app.
- Our own backend at www.glovebox.bg, one endpoint (/api/account/delete) used by
  the in-app deletion.
No advertising, analytics, tracking, AI or payment services of any kind.

REGIONAL DIFFERENCES
None - identical features and content everywhere, no geo-gating. The interface
is Bulgarian only and the obligations are specific to Bulgarian law, so it is
useful mainly in Bulgaria, but it stays available in all territories so
Bulgarians living abroad can install it.

REGULATED INDUSTRY
No. Glovebox is not an insurance provider, broker, agent or comparison service.
It does not sell, quote, arrange, underwrite or process insurance or any other
financial product, takes no payments, and connects to no insurer, government
registry or payment system. The user types in dates from documents they already
hold; the app stores them and reminds them, as a calendar entry would.
```

## App Privacy (въпросникът)

Всичко е **Linked to the User** и се ползва само за **App Functionality**.
**Не** се ползва за проследяване (Tracking: No) и **не** за реклама.

| Категория | Данни | Защо |
| --- | --- | --- |
| Contact Info | Email Address | Вход и напомняния по имейл |
| Contact Info | Name | Показва се в профила |
| User Content | Other User Content | Качените документи (полици, талони) |
| Identifiers | User ID | Свързва данните със сметката |
| Other Data | Other Data | Данни за автомобила и сроковете |

Мобилното приложение **не** събира диагностика (няма Sentry/PostHog в него — само уеб-ът ги ползва).

## Export compliance

Вече е решено в `app.json` — `ios.config.usesNonExemptEncryption: false`. App Store Connect
няма да пита допълнително.

## Скрийншоти

Задължителни: **6.9" iPhone** — 1290×2796 или 1320×2868 пиксела. Минимум 3, максимум 10.

Предложен ред (какво да заснемеш):
1. Таблото с двата автомобила и статусите
2. BMW-то отворено, със списъка от услуги и цветните статуси
3. Екранът „Напомняния"
4. „Анализ" — разходите по месеци
5. Профилът или добавяне на услуга
