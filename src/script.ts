import { exports, hb_tag, hb_untag, string_to_ascii_ptr } from "./helpers";

/**
 * A {@link https://harfbuzz.github.io/harfbuzz-hb-common.html#hb-script-t | HarfBuzz script}.
 *
 * Data type for scripts. Each Script's tag is an `hb_tag_t` corresponding to
 * the four-letter values defined by
 * {@link https://unicode.org/iso15924/ | ISO 15924}.
 *
 * See also the Script (sc) property of the Unicode Character Database.
 */
export class Script {
  /** `Zyyy` */
  static readonly COMMON = new Script(hb_tag("Zyyy"));
  /** `Zinh` */
  static readonly INHERITED = new Script(hb_tag("Zinh"));
  /** `Zzzz` */
  static readonly UNKNOWN = new Script(hb_tag("Zzzz"));
  /** `Arab` */
  static readonly ARABIC = new Script(hb_tag("Arab"));
  /** `Armn` */
  static readonly ARMENIAN = new Script(hb_tag("Armn"));
  /** `Beng` */
  static readonly BENGALI = new Script(hb_tag("Beng"));
  /** `Cyrl` */
  static readonly CYRILLIC = new Script(hb_tag("Cyrl"));
  /** `Deva` */
  static readonly DEVANAGARI = new Script(hb_tag("Deva"));
  /** `Geor` */
  static readonly GEORGIAN = new Script(hb_tag("Geor"));
  /** `Grek` */
  static readonly GREEK = new Script(hb_tag("Grek"));
  /** `Gujr` */
  static readonly GUJARATI = new Script(hb_tag("Gujr"));
  /** `Guru` */
  static readonly GURMUKHI = new Script(hb_tag("Guru"));
  /** `Hang` */
  static readonly HANGUL = new Script(hb_tag("Hang"));
  /** `Hani` */
  static readonly HAN = new Script(hb_tag("Hani"));
  /** `Hebr` */
  static readonly HEBREW = new Script(hb_tag("Hebr"));
  /** `Hira` */
  static readonly HIRAGANA = new Script(hb_tag("Hira"));
  /** `Knda` */
  static readonly KANNADA = new Script(hb_tag("Knda"));
  /** `Kana` */
  static readonly KATAKANA = new Script(hb_tag("Kana"));
  /** `Laoo` */
  static readonly LAO = new Script(hb_tag("Laoo"));
  /** `Latn` */
  static readonly LATIN = new Script(hb_tag("Latn"));
  /** `Mlym` */
  static readonly MALAYALAM = new Script(hb_tag("Mlym"));
  /** `Orya` */
  static readonly ORIYA = new Script(hb_tag("Orya"));
  /** `Taml` */
  static readonly TAMIL = new Script(hb_tag("Taml"));
  /** `Telu` */
  static readonly TELUGU = new Script(hb_tag("Telu"));
  /** `Thai` */
  static readonly THAI = new Script(hb_tag("Thai"));
  /** `Tibt` */
  static readonly TIBETAN = new Script(hb_tag("Tibt"));
  /** `Bopo` */
  static readonly BOPOMOFO = new Script(hb_tag("Bopo"));
  /** `Brai` */
  static readonly BRAILLE = new Script(hb_tag("Brai"));
  /** `Cans` */
  static readonly CANADIAN_SYLLABICS = new Script(hb_tag("Cans"));
  /** `Cher` */
  static readonly CHEROKEE = new Script(hb_tag("Cher"));
  /** `Ethi` */
  static readonly ETHIOPIC = new Script(hb_tag("Ethi"));
  /** `Khmr` */
  static readonly KHMER = new Script(hb_tag("Khmr"));
  /** `Mong` */
  static readonly MONGOLIAN = new Script(hb_tag("Mong"));
  /** `Mymr` */
  static readonly MYANMAR = new Script(hb_tag("Mymr"));
  /** `Ogam` */
  static readonly OGHAM = new Script(hb_tag("Ogam"));
  /** `Runr` */
  static readonly RUNIC = new Script(hb_tag("Runr"));
  /** `Sinh` */
  static readonly SINHALA = new Script(hb_tag("Sinh"));
  /** `Syrc` */
  static readonly SYRIAC = new Script(hb_tag("Syrc"));
  /** `Thaa` */
  static readonly THAANA = new Script(hb_tag("Thaa"));
  /** `Yiii` */
  static readonly YI = new Script(hb_tag("Yiii"));
  /** `Dsrt` */
  static readonly DESERET = new Script(hb_tag("Dsrt"));
  /** `Goth` */
  static readonly GOTHIC = new Script(hb_tag("Goth"));
  /** `Ital` */
  static readonly OLD_ITALIC = new Script(hb_tag("Ital"));
  /** `Buhd` */
  static readonly BUHID = new Script(hb_tag("Buhd"));
  /** `Hano` */
  static readonly HANUNOO = new Script(hb_tag("Hano"));
  /** `Tglg` */
  static readonly TAGALOG = new Script(hb_tag("Tglg"));
  /** `Tagb` */
  static readonly TAGBANWA = new Script(hb_tag("Tagb"));
  /** `Cprt` */
  static readonly CYPRIOT = new Script(hb_tag("Cprt"));
  /** `Limb` */
  static readonly LIMBU = new Script(hb_tag("Limb"));
  /** `Linb` */
  static readonly LINEAR_B = new Script(hb_tag("Linb"));
  /** `Osma` */
  static readonly OSMANYA = new Script(hb_tag("Osma"));
  /** `Shaw` */
  static readonly SHAVIAN = new Script(hb_tag("Shaw"));
  /** `Tale` */
  static readonly TAI_LE = new Script(hb_tag("Tale"));
  /** `Ugar` */
  static readonly UGARITIC = new Script(hb_tag("Ugar"));
  /** `Bugi` */
  static readonly BUGINESE = new Script(hb_tag("Bugi"));
  /** `Copt` */
  static readonly COPTIC = new Script(hb_tag("Copt"));
  /** `Glag` */
  static readonly GLAGOLITIC = new Script(hb_tag("Glag"));
  /** `Khar` */
  static readonly KHAROSHTHI = new Script(hb_tag("Khar"));
  /** `Talu` */
  static readonly NEW_TAI_LUE = new Script(hb_tag("Talu"));
  /** `Xpeo` */
  static readonly OLD_PERSIAN = new Script(hb_tag("Xpeo"));
  /** `Sylo` */
  static readonly SYLOTI_NAGRI = new Script(hb_tag("Sylo"));
  /** `Tfng` */
  static readonly TIFINAGH = new Script(hb_tag("Tfng"));
  /** `Bali` */
  static readonly BALINESE = new Script(hb_tag("Bali"));
  /** `Xsux` */
  static readonly CUNEIFORM = new Script(hb_tag("Xsux"));
  /** `Nkoo` */
  static readonly NKO = new Script(hb_tag("Nkoo"));
  /** `Phag` */
  static readonly PHAGS_PA = new Script(hb_tag("Phag"));
  /** `Phnx` */
  static readonly PHOENICIAN = new Script(hb_tag("Phnx"));
  /** `Cari` */
  static readonly CARIAN = new Script(hb_tag("Cari"));
  /** `Cham` */
  static readonly CHAM = new Script(hb_tag("Cham"));
  /** `Kali` */
  static readonly KAYAH_LI = new Script(hb_tag("Kali"));
  /** `Lepc` */
  static readonly LEPCHA = new Script(hb_tag("Lepc"));
  /** `Lyci` */
  static readonly LYCIAN = new Script(hb_tag("Lyci"));
  /** `Lydi` */
  static readonly LYDIAN = new Script(hb_tag("Lydi"));
  /** `Olck` */
  static readonly OL_CHIKI = new Script(hb_tag("Olck"));
  /** `Rjng` */
  static readonly REJANG = new Script(hb_tag("Rjng"));
  /** `Saur` */
  static readonly SAURASHTRA = new Script(hb_tag("Saur"));
  /** `Sund` */
  static readonly SUNDANESE = new Script(hb_tag("Sund"));
  /** `Vaii` */
  static readonly VAI = new Script(hb_tag("Vaii"));
  /** `Avst` */
  static readonly AVESTAN = new Script(hb_tag("Avst"));
  /** `Bamu` */
  static readonly BAMUM = new Script(hb_tag("Bamu"));
  /** `Egyp` */
  static readonly EGYPTIAN_HIEROGLYPHS = new Script(hb_tag("Egyp"));
  /** `Armi` */
  static readonly IMPERIAL_ARAMAIC = new Script(hb_tag("Armi"));
  /** `Phli` */
  static readonly INSCRIPTIONAL_PAHLAVI = new Script(hb_tag("Phli"));
  /** `Prti` */
  static readonly INSCRIPTIONAL_PARTHIAN = new Script(hb_tag("Prti"));
  /** `Java` */
  static readonly JAVANESE = new Script(hb_tag("Java"));
  /** `Kthi` */
  static readonly KAITHI = new Script(hb_tag("Kthi"));
  /** `Lisu` */
  static readonly LISU = new Script(hb_tag("Lisu"));
  /** `Mtei` */
  static readonly MEETEI_MAYEK = new Script(hb_tag("Mtei"));
  /** `Sarb` */
  static readonly OLD_SOUTH_ARABIAN = new Script(hb_tag("Sarb"));
  /** `Orkh` */
  static readonly OLD_TURKIC = new Script(hb_tag("Orkh"));
  /** `Samr` */
  static readonly SAMARITAN = new Script(hb_tag("Samr"));
  /** `Lana` */
  static readonly TAI_THAM = new Script(hb_tag("Lana"));
  /** `Tavt` */
  static readonly TAI_VIET = new Script(hb_tag("Tavt"));
  /** `Batk` */
  static readonly BATAK = new Script(hb_tag("Batk"));
  /** `Brah` */
  static readonly BRAHMI = new Script(hb_tag("Brah"));
  /** `Mand` */
  static readonly MANDAIC = new Script(hb_tag("Mand"));
  /** `Cakm` */
  static readonly CHAKMA = new Script(hb_tag("Cakm"));
  /** `Merc` */
  static readonly MEROITIC_CURSIVE = new Script(hb_tag("Merc"));
  /** `Mero` */
  static readonly MEROITIC_HIEROGLYPHS = new Script(hb_tag("Mero"));
  /** `Plrd` */
  static readonly MIAO = new Script(hb_tag("Plrd"));
  /** `Shrd` */
  static readonly SHARADA = new Script(hb_tag("Shrd"));
  /** `Sora` */
  static readonly SORA_SOMPENG = new Script(hb_tag("Sora"));
  /** `Takr` */
  static readonly TAKRI = new Script(hb_tag("Takr"));
  /** `Bass` */
  static readonly BASSA_VAH = new Script(hb_tag("Bass"));
  /** `Aghb` */
  static readonly CAUCASIAN_ALBANIAN = new Script(hb_tag("Aghb"));
  /** `Dupl` */
  static readonly DUPLOYAN = new Script(hb_tag("Dupl"));
  /** `Elba` */
  static readonly ELBASAN = new Script(hb_tag("Elba"));
  /** `Gran` */
  static readonly GRANTHA = new Script(hb_tag("Gran"));
  /** `Khoj` */
  static readonly KHOJKI = new Script(hb_tag("Khoj"));
  /** `Sind` */
  static readonly KHUDAWADI = new Script(hb_tag("Sind"));
  /** `Lina` */
  static readonly LINEAR_A = new Script(hb_tag("Lina"));
  /** `Mahj` */
  static readonly MAHAJANI = new Script(hb_tag("Mahj"));
  /** `Mani` */
  static readonly MANICHAEAN = new Script(hb_tag("Mani"));
  /** `Mend` */
  static readonly MENDE_KIKAKUI = new Script(hb_tag("Mend"));
  /** `Modi` */
  static readonly MODI = new Script(hb_tag("Modi"));
  /** `Mroo` */
  static readonly MRO = new Script(hb_tag("Mroo"));
  /** `Nbat` */
  static readonly NABATAEAN = new Script(hb_tag("Nbat"));
  /** `Narb` */
  static readonly OLD_NORTH_ARABIAN = new Script(hb_tag("Narb"));
  /** `Perm` */
  static readonly OLD_PERMIC = new Script(hb_tag("Perm"));
  /** `Hmng` */
  static readonly PAHAWH_HMONG = new Script(hb_tag("Hmng"));
  /** `Palm` */
  static readonly PALMYRENE = new Script(hb_tag("Palm"));
  /** `Pauc` */
  static readonly PAU_CIN_HAU = new Script(hb_tag("Pauc"));
  /** `Phlp` */
  static readonly PSALTER_PAHLAVI = new Script(hb_tag("Phlp"));
  /** `Sidd` */
  static readonly SIDDHAM = new Script(hb_tag("Sidd"));
  /** `Tirh` */
  static readonly TIRHUTA = new Script(hb_tag("Tirh"));
  /** `Wara` */
  static readonly WARANG_CITI = new Script(hb_tag("Wara"));
  /** `Ahom` */
  static readonly AHOM = new Script(hb_tag("Ahom"));
  /** `Hluw` */
  static readonly ANATOLIAN_HIEROGLYPHS = new Script(hb_tag("Hluw"));
  /** `Hatr` */
  static readonly HATRAN = new Script(hb_tag("Hatr"));
  /** `Mult` */
  static readonly MULTANI = new Script(hb_tag("Mult"));
  /** `Hung` */
  static readonly OLD_HUNGARIAN = new Script(hb_tag("Hung"));
  /** `Sgnw` */
  static readonly SIGNWRITING = new Script(hb_tag("Sgnw"));
  /** `Adlm` */
  static readonly ADLAM = new Script(hb_tag("Adlm"));
  /** `Bhks` */
  static readonly BHAIKSUKI = new Script(hb_tag("Bhks"));
  /** `Marc` */
  static readonly MARCHEN = new Script(hb_tag("Marc"));
  /** `Osge` */
  static readonly OSAGE = new Script(hb_tag("Osge"));
  /** `Tang` */
  static readonly TANGUT = new Script(hb_tag("Tang"));
  /** `Newa` */
  static readonly NEWA = new Script(hb_tag("Newa"));
  /** `Gonm` */
  static readonly MASARAM_GONDI = new Script(hb_tag("Gonm"));
  /** `Nshu` */
  static readonly NUSHU = new Script(hb_tag("Nshu"));
  /** `Soyo` */
  static readonly SOYOMBO = new Script(hb_tag("Soyo"));
  /** `Zanb` */
  static readonly ZANABAZAR_SQUARE = new Script(hb_tag("Zanb"));
  /** `Dogr` */
  static readonly DOGRA = new Script(hb_tag("Dogr"));
  /** `Gong` */
  static readonly GUNJALA_GONDI = new Script(hb_tag("Gong"));
  /** `Rohg` */
  static readonly HANIFI_ROHINGYA = new Script(hb_tag("Rohg"));
  /** `Maka` */
  static readonly MAKASAR = new Script(hb_tag("Maka"));
  /** `Medf` */
  static readonly MEDEFAIDRIN = new Script(hb_tag("Medf"));
  /** `Sogo` */
  static readonly OLD_SOGDIAN = new Script(hb_tag("Sogo"));
  /** `Sogd` */
  static readonly SOGDIAN = new Script(hb_tag("Sogd"));
  /** `Elym` */
  static readonly ELYMAIC = new Script(hb_tag("Elym"));
  /** `Nand` */
  static readonly NANDINAGARI = new Script(hb_tag("Nand"));
  /** `Hmnp` */
  static readonly NYIAKENG_PUACHUE_HMONG = new Script(hb_tag("Hmnp"));
  /** `Wcho` */
  static readonly WANCHO = new Script(hb_tag("Wcho"));
  /** `Chrs` */
  static readonly CHORASMIAN = new Script(hb_tag("Chrs"));
  /** `Diak` */
  static readonly DIVES_AKURU = new Script(hb_tag("Diak"));
  /** `Kits` */
  static readonly KHITAN_SMALL_SCRIPT = new Script(hb_tag("Kits"));
  /** `Yezi` */
  static readonly YEZIDI = new Script(hb_tag("Yezi"));
  /** `Cpmn` */
  static readonly CYPRO_MINOAN = new Script(hb_tag("Cpmn"));
  /** `Ougr` */
  static readonly OLD_UYGHUR = new Script(hb_tag("Ougr"));
  /** `Tnsa` */
  static readonly TANGSA = new Script(hb_tag("Tnsa"));
  /** `Toto` */
  static readonly TOTO = new Script(hb_tag("Toto"));
  /** `Vith` */
  static readonly VITHKUQI = new Script(hb_tag("Vith"));
  /** `Zmth` */
  static readonly MATH = new Script(hb_tag("Zmth"));
  /** `Kawi` */
  static readonly KAWI = new Script(hb_tag("Kawi"));
  /** `Nagm` */
  static readonly NAG_MUNDARI = new Script(hb_tag("Nagm"));
  /** `Gara` */
  static readonly GARAY = new Script(hb_tag("Gara"));
  /** `Gukh` */
  static readonly GURUNG_KHEMA = new Script(hb_tag("Gukh"));
  /** `Krai` */
  static readonly KIRAT_RAI = new Script(hb_tag("Krai"));
  /** `Onao` */
  static readonly OL_ONAL = new Script(hb_tag("Onao"));
  /** `Sunu` */
  static readonly SUNUWAR = new Script(hb_tag("Sunu"));
  /** `Todr` */
  static readonly TODHRI = new Script(hb_tag("Todr"));
  /** `Tutg` */
  static readonly TULU_TIGALARI = new Script(hb_tag("Tutg"));
  /** `Berf` */
  static readonly BERIA_ERFE = new Script(hb_tag("Berf"));
  /** `Sidt` */
  static readonly SIDETIC = new Script(hb_tag("Sidt"));
  /** `Tayo` */
  static readonly TAI_YO = new Script(hb_tag("Tayo"));
  /** `Tols` */
  static readonly TOLONG_SIKI = new Script(hb_tag("Tols"));

  /** No script set. */
  static readonly INVALID = new Script(0);

  readonly value: number;

  /**
   * Converts a string representing an ISO 15924 script tag to a corresponding
   * Script.
   * @param tag A string representing an ISO 15924 tag.
   */
  constructor(tag: string);
  /** @internal Wrap an existing hb_script_t. */
  constructor(existingTag: number);
  constructor(arg: string | number) {
    if (typeof arg === "number") {
      this.value = arg;
    } else {
      const strPtr = string_to_ascii_ptr(arg);
      this.value = exports.hb_script_from_string(strPtr.ptr, -1);
      strPtr.free();
    }
  }

  /**
   * Converts the Script to a corresponding ISO 15924 script tag.
   * @returns A string representing an ISO 15924 script tag.
   */
  toString(): string {
    return hb_untag(this.value);
  }
}
