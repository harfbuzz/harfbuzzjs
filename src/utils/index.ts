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