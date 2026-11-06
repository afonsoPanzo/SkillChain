/**
 * Maps program and wallet errors to Portuguese messages (SDD section 4.3).
 * Anchor custom errors start at 6000, in declaration order.
 */

export const PROGRAM_ERRORS = [
  { name: "WrongLevel", message: "O nível anterior ainda não foi concluído." },
  {
    name: "InvalidRecipient",
    message: "O destinatário não pode ser a tua própria carteira.",
  },
  {
    name: "MessageTooLong",
    message: "A mensagem tem de ter entre 1 e 100 caracteres.",
  },
  { name: "UnknownItem", message: "Este item não existe." },
  { name: "AlreadyOwned", message: "Já tens este item." },
  {
    name: "LevelTooLow",
    message: "Precisas de um nível mais alto para este item.",
  },
  { name: "NotEnoughPoints", message: "Não tens pontos suficientes." },
  { name: "NotOwned", message: "Ainda não tens este item." },
  { name: "Unauthorized", message: "Este perfil não te pertence." },
] as const;

export type ProgramErrorName = (typeof PROGRAM_ERRORS)[number]["name"];

export const ANCHOR_ERROR_OFFSET = 6000;

export const CANCELLED_MESSAGE = "Transacção cancelada.";
export const GENERIC_MESSAGE =
  "Não foi possível concluir a transacção. Tenta outra vez.";

/** Thrown by the mock backend to mimic an on-chain error. */
export class SkillChainProgramError extends Error {
  readonly code: ProgramErrorName;
  constructor(code: ProgramErrorName) {
    super(`Error Code: ${code}`);
    this.name = "SkillChainProgramError";
    this.code = code;
  }
}

function messageChain(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let i = 0; i < 5 && current != null; i++) {
    if (current instanceof Error) {
      parts.push(current.message);
      const logs = (current as { logs?: unknown }).logs;
      if (Array.isArray(logs)) parts.push(logs.join("\n"));
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join("\n");
}

export function toUserMessage(err: unknown): string {
  const text = messageChain(err);

  if (/user (?:rejected|declined|denied)|rejected (?:by|the)|request was rejected/i.test(text)) {
    return CANCELLED_MESSAGE;
  }

  for (const { name, message } of PROGRAM_ERRORS) {
    if (new RegExp(`\\b${name}\\b`).test(text)) return message;
  }

  const hex = /custom program error: 0x([0-9a-f]+)/i.exec(text);
  if (hex) {
    const entry = PROGRAM_ERRORS[parseInt(hex[1], 16) - ANCHOR_ERROR_OFFSET];
    if (entry) return entry.message;
  }

  if (/already in use/i.test(text)) return "O teu perfil já existe.";
  if (/insufficient (?:funds|lamports)|attempt to debit an account/i.test(text)) {
    return "Não tens SOL suficiente para esta transacção.";
  }
  if (/blockhash not found|block height exceeded|expired/i.test(text)) {
    return "A transacção expirou. Tenta outra vez.";
  }

  return GENERIC_MESSAGE;
}
