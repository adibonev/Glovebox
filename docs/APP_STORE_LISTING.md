# App Store Connect — данни за подаване

Копирай оттук в App Store Connect. Всичко е на български (BG-only пуск, ADR-0004).

## Основно

| Поле | Стойност |
| --- | --- |
| Bundle ID | `bg.glovebox.app` |
| SKU | `glovebox-ios` |
| Primary language | Bulgarian |
| Primary category | Utilities |
| Secondary category | Productivity |
| Age rating | 4+ |
| Price | Free |

## Име и подзаглавие

**App Name** (макс. 30 знака) — две възможности:
- `Glovebox` — чисто, по марката
- `Glovebox: документи за кола` (27) — по-добро за търсене

**Subtitle** (макс. 30 знака):
```
ГО, винетка и преглед навреме
```

## Ключови думи (макс. 100 знака, със запетаи, без интервали след тях)

```
ГО,винетка,технически преглед,каско,данък МПС,застраховка,автомобил,напомняне,документи,кола
```

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
The app is Bulgarian-only (launching in Bulgaria) and helps drivers track vehicle
document expiry dates: insurance, road tax, vignette, roadworthiness inspection.

The demo account is pre-populated with two vehicles and twelve service records so
every state is visible: valid (green), expiring soon (amber) and expired (red).

ACCOUNT DELETION (Guideline 5.1.1(v)): open the "Профил" tab (rightmost), scroll to
the bottom, and tap "Изтрий акаунта" in the red-outlined section. It asks for
confirmation twice, then permanently deletes the account and all of its data.

The app is free with no in-app purchases and no subscriptions in this version.
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
