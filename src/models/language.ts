/**
 * A model of a language
 */
export class Language {
  /**
   * A two letter code representing the language
   */
  twoLetterCode = '';

  /**
   * Is this language selected?
   */
  isSelected = false;

  /**
   * Build the model
   *
   * @param codes           An array of codes for this specific language
   * @param text            The text for this language
   * @param isDefault=false Is this the default language
   * @param isRtl=false     Is the language right to left?
   *
   */
  constructor(
    public codes: Array<string>,
    public text: string,
    public isDefault = false,
    public isRtl = false,
  ) {
    this.codes = codes.map((code) => code.toLowerCase());
    const specific = codes.find((code) => code.length === 2);
    const dashed = codes.find((code) => code.indexOf('-') !== -1);
    if (specific) {
      this.twoLetterCode = specific;
    } else if (dashed) {
      this.twoLetterCode = dashed.split('-')[0];
    }
  }

}
