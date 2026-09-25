import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { OperatorDetails } from "@/components/OperatorDetails";

export const metadata: Metadata = {
  title: "За нас · Glovebox",
  description: "Защо направихме Glovebox и какво ти обещаваме.",
};

/**
 * Who makes Glovebox, why, and what it promises. In a person's voice, short on purpose.
 *
 * The promise is to remind on time, not to guarantee no fine: the Terms say reminders are a help,
 * not a guarantee, and this page must not say otherwise.
 */
export default function AboutPage() {
  return (
    <LegalPage title="За нас">
      <p>
        Всеки познава някого, който е платил глоба за изтекла гражданска или преглед. Не защото не
        му пука, а защото е забравил датата. Направихме Glovebox, за да не ти се случва.
      </p>

      <h2>Какво ти обещаваме</h2>
      <p>
        Да ти кажем навреме. Първо когато срокът наближи, после два дни и един ден преди края, и
        още веднъж, ако датата мине. Идеята е никога повече да не плащаш глоба за срок, който
        просто си забравил.
      </p>
      <p>
        И да пазим това, което ни даваш. Ако решиш да си ситръгнеш, изтриваш акаунта с едно натискане и с него изчезва всичко.
      </p>
      <p>Безплатно, без карта и без уловки.</p>

      <h2>Кой стои зад Glovebox</h2>
      <p>
        Правим го в България, за шофьори в България. Ако нещо не работи, липсва ти срок или имаш
        идея, пиши ни.
      </p>
      <OperatorDetails />
    </LegalPage>
  );
}
