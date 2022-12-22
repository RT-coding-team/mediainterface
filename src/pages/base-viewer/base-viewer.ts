import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { take } from 'rxjs/operators/take';
import { LanguageProvider } from '@providers/language/language';
import { NavParamsDataStoreProvider } from '@providers/nav-params-data-store/nav-params-data-store';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';
import { ViewerItem } from '@interfaces/viewer-item.interface';
import { Language } from '@models/language';

/**
 * A base viewer for the viewers to inherit from.  Stores common code.
 * Children of this class MUST implement BaseViewerPageInterface.
 */
@Component({
  template: ''
})
export class BaseViewerPage {

  /**
   * The first item to display.
   */
  protected firstItem: ViewerItem = null;

  /**
   * The items being viewed
   */
  protected items: Array<ViewerItem> = null;

  /**
   * The slug for the previous page
   */
  protected slug = '';

  /**
   * The key to use for our storage
   */
  protected storageKey = 'viewer-item';

  constructor(
    protected dataStore: NavParamsDataStoreProvider,
    protected languageProvider: LanguageProvider,
    protected navController: NavController,
    protected navParams: NavParams,
    protected statReporterProvider: StatReporterProvider,
    protected viewController: ViewController,
  ) {
  }

  /**
   * Ionic view lifecycle
   *
   * @return void
   */
  ionViewDidLoad() {
    this.slug = this.navParams.get('slug');
    this.items = this.navParams.get('items');
    if (typeof this.items === 'undefined') {
        // They refreshed the page. Get the data from the store.
        this.dataStore.get(this.storageKey).pipe(take(1)).subscribe((data: string) => {
          if (data === '') {
            this.goBack();
          }
          this.items = JSON.parse(data);
          this.firstItem = this.items.find((item: ViewerItem) =>  item.isFirst);
          // @ts-ignore It needs to be implemented by child class
          this.loadFile();
        });
    } else {
      this.firstItem = this.items.find((item: ViewerItem) =>  item.isFirst);
      this.dataStore.store(this.storageKey, JSON.stringify(this.items)).pipe(take(1)).subscribe(() => {
        // @ts-ignore It needs to be implemented by child class
        this.loadFile();
      });
    }
  }

  /**
   * Go back to the previous page
   *
   * @return void
   */
  goBack() {
    this.dataStore.remove(this.storageKey);
    if (this.navController.canGoBack()) {
      this.navController.pop();
    } else if (this.slug !== '') {
      this.navController.push(
        'media-details',
        { slug: this.slug },
        {
          animate: true,
          direction: 'back',
        },
      ).then(() => {
        // Remove us from backstack
        this.navController.remove(this.viewController.index);
        this.navController.insert(0, 'HomePage');
      });
    } else {
      this.navController.goToRoot({
        animate: true,
      });
    }
  }

  /**
   * Report the viewing of an item
   *
   * @param  item         The item being viewed
   * @param  interaction  How are they interacting
   * @return              The item received
   */
  reportView(item: ViewerItem, interaction = 'view'): Observable<ViewerItem> {
    if (!item) {
      return of(null);
    }
    return this.languageProvider.getLanguage().pipe(
      mergeMap((lang: Language) =>  this.statReporterProvider.report(item.slug, interaction, lang.code, item.provider, item.type).pipe(map(() =>  item)))
    );
  }

}
