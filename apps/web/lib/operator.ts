/**
 * Who provides Glovebox: the details Bulgarian law asks an online service to show (Закон за
 * електронната търговия, чл. 4). One place, read by the Terms, the Privacy Policy and „За нас“.
 * A field left null is simply not shown.
 *
 * When billing is switched on and a company is registered, this becomes the company: its name,
 * ЕИК, registered seat and, if it has one, its VAT number.
 */
export const OPERATOR = {
  name: "Адалберт Бонев",
  /** Legal form, as the Terms state it. */
  kind: "физическо лице",
  /** Permanent address (ЗЕТ чл. 4, ал. 1, т. 2). */
  address: null as string | null,
  email: "bonev112@gmail.com",
  phone: null as string | null,
  /** ЕИК once the operator is a company. */
  companyId: null as string | null,
};
