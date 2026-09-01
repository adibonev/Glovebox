# Имейл шаблони за Supabase Auth

Шестте шаблона по-долу са в същия ред, в който ги подрежда **Supabase → Authentication →
Emails → Templates**. Всеки има поле Subject и тяло.

Работят пълноценно само след като е включен custom SMTP през Resend (домейнът `glovebox.bg`
е verified), иначе имейлите пак тръгват от адрес на Supabase.

**Кои реално се пращат днес:** „Confirm sign up" при регистрация и „Reset password" при
забравена парола. Останалите четири не се задействат при сегашните настройки, но си струва
да са попълнени — ако някой ден включиш magic link или защитена смяна на парола, няма да
изненадаш потребител с английски имейл от чужда марка.

**Защо логото е и картинка, и текст:** иконата се зарежда от
`https://www.glovebox.bg/email-logo.png`. Повечето имейл клиенти обаче блокират картинките,
докато получателят не ги разреши — затова надписът „Glovebox" до нея остава текст. Ако
картинката не се зареди, марката пак се вижда.

**Защо са таблици и inline стилове:** имейл клиентите не поддържат външен CSS, flexbox или
grid, а Gmail изрязва `<style>` блоковете. Това е единственият начин оформлението да изглежда
еднакво навсякъде. По същата причина шрифтът е Georgia — имейлът не зарежда собствени
шрифтове, а тя е най-близката серифна до Fraunces, която я има на всяко устройство.

---

## 1. Confirm sign up — потвърждаване на регистрация

**Subject**

```
Потвърди имейла си за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Добре дошъл в Glovebox</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Остава една стъпка. Потвърди имейла си и започваш да следиш сроковете на колата си — гражданска отговорност, винетка, технически преглед и всичко останало.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Потвърди имейла</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си се регистрирал в Glovebox? Просто изтрий този имейл — без потвърждение нищо не се случва.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2. Invite user — покана за профил

**Subject**

```
Покана за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Покана за Glovebox</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Създаден е профил за {{ .Email }}. Приеми поканата, за да си зададеш парола и да започнеш да следиш сроковете на колата си на едно място.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Приеми поканата</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не очакваш покана? Изтрий този имейл — профилът остава неактивен.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 3. Magic link or OTP — еднократен вход

Този шаблон обслужва и линка, и шестцифрения код, затова съдържа и двете — потребителят
ползва каквото му е удобно.

**Subject**

```
Вход в Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Вход в Glovebox</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Натисни бутона, за да влезеш в профила си. Не се иска парола.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Влез в Glovebox</a>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;padding-bottom:12px;">Или въведи този код:</div>
        <div style="display:inline-block;background-color:#07100C;border:1px solid rgba(196,149,76,0.35);border-radius:12px;padding:14px 26px;font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:bold;letter-spacing:7px;color:#C4954C;">{{ .Token }}</div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си искал да влизаш? Изтрий този имейл и никой няма достъп до профила ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 4. Change email address — смяна на имейл

**Subject**

```
Потвърди новия си имейл за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Нов имейл адрес</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Заяви смяна на имейла за профила си от {{ .Email }} на {{ .NewEmail }}. Потвърди от новия адрес, за да влезе в сила.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Потвърди новия имейл</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си заявявал смяна? Игнорирай този имейл и провери паролата си.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 5. Reset password — забравена парола

**Subject**

```
Нова парола за Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Смяна на паролата</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Получихме заявка да смениш паролата си. Натисни бутона и си избери нова.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#14503A;color:#F4F1EA;text-decoration:none;padding:14px 30px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:bold;">Задай нова парола</a>
      </td></tr>
      <tr><td style="padding:24px 36px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8A928C;line-height:1.6;">
          Ако бутонът не работи, отвори този адрес:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#C4954C;word-break:break-all;">{{ .ConfirmationURL }}</a>
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си искал нова парола? Игнорирай този имейл — старата остава валидна.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 6. Reauthentication — код преди важна промяна

Този има само код, без бутон — праща се, преди потребителят да направи нещо чувствително,
и се въвежда обратно в приложението.

**Subject**

```
Код за потвърждение — Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Код за потвърждение</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Въведи този код, за да потвърдиш промяната по профила си.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="display:inline-block;background-color:#07100C;border:1px solid rgba(196,149,76,0.35);border-radius:12px;padding:16px 28px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:bold;letter-spacing:8px;color:#C4954C;">{{ .Token }}</div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Не си заявявал промяна? Не въвеждай кода никъде и смени паролата си.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

# Security известия

Тези са в **Supabase → Authentication → Emails → Security**, отделно от шестте по-горе. Всяко
има собствен шаблон зад стрелката вдясно от превключвателя.

Това са **известия след факта**, не потвърждения — казват на потребителя, че нещо се е случило,
и му дават път да реагира, ако не е бил той. Затова нямат бутон за действие и не ползват
променливи: няма какво да се потвърждава.

И седемте превключвателя в Security са включени, затова и седемте имат шаблон. Последните три
— телефон и двата за MFA — няма как да се задействат при сегашните настройки (няма нито
телефонен вход, нито MFA), но са попълнени, за да не остане поле, което един ден да изпрати
английски текст от чуждо име.

## 1. Password changed — сменена парола

**Subject**

```
Паролата ти за Glovebox е сменена
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Паролата ти е сменена</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Паролата за профила ти в Glovebox беше променена току-що. Ако си го направил ти, няма нужда от нищо повече.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```


## 2. Email address changed — сменен имейл

**Subject**

```
Имейлът за Glovebox е сменен
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Имейлът на профила ти е сменен</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Адресът за вход в Glovebox беше променен. Отсега нататък влизаш с новия имейл.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```


## 3. Sign-in method linked — добавен начин за вход

**Subject**

```
Нов начин за вход в Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Нов начин за вход</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Към профила ти в Glovebox беше добавен нов начин за вход — например Google или Apple. Оттук нататък можеш да влизаш и с него.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```


## 4. Sign-in method removed — премахнат начин за вход

**Subject**

```
Премахнат начин за вход в Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Премахнат начин за вход</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Начин за вход беше премахнат от профила ти в Glovebox. Увери се, че ти остава поне един работещ начин да влезеш.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```


## 5. Phone number changed — сменен телефон

**Subject**

```
Телефонният номер за Glovebox е сменен
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Телефонният номер на профила ти</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Телефонният номер, свързан с профила ти в Glovebox, беше променен.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```


## 6. MFA method added — добавена двуфакторна защита

**Subject**

```
Добавена двуфакторна защита в Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Нова двуфакторна защита</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Към профила ти в Glovebox беше добавена двуфакторна защита. Отсега при вход ще се иска и втора стъпка.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```


## 7. MFA method removed — премахната двуфакторна защита

**Subject**

```
Премахната двуфакторна защита в Glovebox
```

**Body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07100C;margin:0;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#0B1712;border:1px solid rgba(244,241,234,0.08);border-radius:16px;">
      <tr><td style="padding:36px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px;"><img src="https://www.glovebox.bg/email-logo.png" width="48" height="48" alt="Glovebox" style="display:block;width:48px;height:48px;border:0;border-radius:11px;"></td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#F4F1EA;">Glove<span style="color:#C4954C;">box</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 36px 0;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#F4F1EA;line-height:1.3;">Премахната двуфакторна защита</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#CFD2CB;line-height:1.6;padding-top:12px;">
          Двуфакторната защита на профила ти в Glovebox беше премахната. Профилът вече се пази само с парола.
        </div>
      </td></tr>
      <tr><td style="padding:28px 36px 36px;">
        <div style="border-top:1px solid rgba(244,241,234,0.08);padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6E756F;line-height:1.6;">
          Ако не си бил ти — <a href="https://www.glovebox.bg/login" style="color:#C4954C;">смени паролата си веднага</a> и провери кой има достъп до пощата ти.<br>
          <a href="https://www.glovebox.bg" style="color:#6E756F;">glovebox.bg</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## Как да ги провериш

Регистрирай се с истински адрес и виж:

1. Подателят е **Glovebox &lt;no-reply@glovebox.bg&gt;**, не Supabase
2. Тъмното оформление се показва правилно в Gmail и в Mail на iPhone
3. Линкът от телефон отваря **приложението**, не сайта — това работи само след като
   `glovebox://auth-callback` е добавен в Redirect URLs и излезе новият билд с
   [lib/authLink.ts](../apps/mobile/lib/authLink.ts)

Тъмният фон се показва както е зададен в Gmail и Apple Mail. Някои версии на Outlook обръщат
цветовете в тъмна тема — ако там излезе странно, има смисъл да се направи светъл вариант.
