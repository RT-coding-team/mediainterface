import { Component, OnInit } from '@angular/core';
import { ViewController } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { zip } from 'rxjs/observable/zip';
import { LanguageProvider } from '@providers/language/language';
import { Language } from '@models/language';

/**
 * The language selector popover
 *
 */
@Component({
  selector: 'language-popover',
  templateUrl: 'language-popover.html'
})
export class LanguagePopoverComponent implements OnInit {

  /**
   * The supported languages
   */
  languages: Array<Language> = [];

  constructor(
    private languageProvider: LanguageProvider,
    private viewController: ViewController,
  ) {}

  /**
   * Angular life cycle on init
   *
   * @return void
   */
  ngOnInit() {
    zip(
      this.languageProvider.getLanguage().pipe(take(1)),
      this.languageProvider.supported().pipe(take(1)),
    ).subscribe(([current, supported]) => {
      this.languages = supported.map((lang: Language) => {
        lang.isSelected = (lang.text === current.text);
        return lang;
      });
    });
  }

  /**
   * Save the selected language
   *
   * @param  language The selected language
   * @return          void
   */
  saveLanguage(language: Language) {
    this.languageProvider.saveLanguage(language).pipe(take(1)).subscribe(() => this.viewController.dismiss());
  }

}
