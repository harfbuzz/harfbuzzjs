export function hb_tag(s: string) {
  return (
    (s.charCodeAt(0) & 0xFF) << 24 |
    (s.charCodeAt(1) & 0xFF) << 16 |
    (s.charCodeAt(2) & 0xFF) <<  8 |
    (s.charCodeAt(3) & 0xFF) <<  0
  )
}

export function hb_untag(tag: number) {
  return [
    String.fromCharCode((tag >> 24) & 0xFF),
    String.fromCharCode((tag >> 16) & 0xFF),
    String.fromCharCode((tag >>  8) & 0xFF),
    String.fromCharCode((tag >>  0) & 0xFF)
  ].join('')
}

export function buffer_flag(s: string) {
  if (s == "BOT") { return 0x1 }
    if (s == "EOT") { return 0x2 }
    if (s == "PRESERVE_DEFAULT_IGNORABLES") { return 0x4 }
    if (s == "REMOVE_DEFAULT_IGNORABLES") { return 0x8 }
    if (s == "DO_NOT_INSERT_DOTTED_CIRCLE") { return 0x10 }
    if (s == "PRODUCE_UNSAFE_TO_CONCAT") { return 0x40 }
    return 0x0
}