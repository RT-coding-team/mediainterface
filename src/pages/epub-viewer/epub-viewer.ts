import { Component } from '@angular/core';
import { Events, IonicPage, NavController, NavParams, Platform, PopoverController, ViewController } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { Book } from 'epubjs';
import { BaseViewerPage } from '@pages/base-viewer/base-viewer';
import { BaseViewerPageInterface } from '@interfaces/base-viewer.interface';
import { LanguageProvider } from '@providers/language/language';
import { NavParamsDataStoreProvider } from '@providers/nav-params-data-store/nav-params-data-store';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';
import { TocItem } from '@interfaces/toc-item.interface';
import { ViewerItem } from '@interfaces/viewer-item.interface';
import { TocPopoverComponent } from '@components/toc-popover/toc-popover';

/**
 * ePubjs is included in index.html
 */
// declare var ePub: any;

/**
 * An epub viewer.
 */
@IonicPage({
  name: 'epub-viewer',
  segment: 'details/:slug/epub-viewer',
})
@Component({
  selector: 'page-epub-viewer',
  templateUrl: 'epub-viewer.html',
})
export class EpubViewerPage extends BaseViewerPage implements BaseViewerPageInterface {

  /**
   * The book we are viewing
   */
  book: any = null;

  /**
   * The current font size in percentage
   */
  fontSize: number = 100;

  /**
   * The item we are viewing
   */
  item: ViewerItem = null;

  /**
   * The rendition of the book
   */
  rendition: any = null;

  /**
   * The current page we are viewing
   */
  currentPage: number = 1;

  /**
   * Do we want to show the toolbars?
   */
  showToolbars: boolean = true;

  /**
   * The title for the current section
   */
  sectionTitle: string = '';

  /**
   * The slug for the previous page
   */
  slug = '';

  /**
   * The table of contents
   */
  private toc: Array<TocItem> = [];

  /**
   * Listen to changes in the TOC component
   */
  private tocStream$: any = null;

  constructor(
    protected dataStore: NavParamsDataStoreProvider,
    protected events: Events,
    protected navController: NavController,
    protected navParams: NavParams,
    protected platform: Platform,
    protected popoverController: PopoverController,
    protected viewController: ViewController,
    languageProvider: LanguageProvider,
    statReporterProvider: StatReporterProvider,
  ) {
    super(
      dataStore,
      languageProvider,
      navController,
      navParams,
      statReporterProvider,
      viewController,
    );
  }

  /**
   * Ionic view lifecycle
   *
   * @return void
   */
  ionViewDidLoad() {
    super.ionViewDidLoad();
    this.tocStream$ = this.events.subscribe('toc-popover:change-page', (selected: TocItem) => this.rendition.display(selected.ref));
  }

  /**
   * Ionic LifeCycle the view will leave
   *
   * @return void
   */
  ionViewWillLeave() {
    if (this.rendition) {
      this.rendition.destroy();
      this.rendition = null;
    }
    if (this.tocStream$) {
      this.tocStream$.unsubscribe();
      this.tocStream$ = null;
    }
  }

  /**
   * Change the page on swipe
   *
   * @param  event The event that triggered it
   * @return       void
   */
  changePage(event) {
    if ((this.platform.isRTL) && (event.velocityX > 0)) {
      this.next();
    } else if ((this.platform.isRTL) && (event.velocityX < 0)) {
      this.prev();
    } else if(event.velocityX < 0) {
      this.next();
    } else {
      this.prev();
    }
  }


  /**
   * Decrease the font size
   *
   * @return void
   */
  decreaseFont() {
      if (this.fontSize <= 20) {
          return;
      }
      this.fontSize -= 10;
      this.rendition.themes.fontSize(`${this.fontSize}%`);
  }

  /**
   * Increase the font size
   *
   * @return void
   */
  increaseFont() {
    this.fontSize += 10;
    this.rendition.themes.fontSize(`${this.fontSize}%`);
  }

  /**
   * A convience method for flatten our toc array
   *
   * @param  arr The array to flatten
   * @return     The new array
   */
  flatten(arr: Array<any>) {
    return [].concat(...arr.map(v => [v, ...this.flatten(v.subitems)]));
  }

  /**
   * Load the file
   *
   * @return void
   */
  loadFile() {
    this.item = this.firstItem;
    this.reportView(this.item).pipe(take(1)).subscribe();
    this.book = new Book(this.item.filePath);
    this.rendition = this.book.renderTo('book', { width: '100%', height: '100%' });
    this.rendition.themes.fontSize(`${this.fontSize}%`);
    this.rendition.display();
    this.rendition.on('rendered', (location) => {
      const titles = this.toc.filter((item: TocItem) => this.book.canonical(item.ref) == this.book.canonical(location.href));
      this.sectionTitle = (titles.length === 1) ? titles[0].label : '';
    });
    /**
     * Set up toc
     */
    this.book.loaded.navigation.then((toc) => {
      this.toc = this.flatten(toc.toc).map((section: any) => {
        const item: TocItem = {
          id: String(section.id),
          label:String(section.label).replace(/(\r\n|\n|\r)/gm, '').trim(),
          ref: String(section.href),
        };
        return item;
      });
    });
  }

  /**
   * Go to the next page.
   *
   * @return void
   */
  next() {
    this.currentPage += 1;
    this.rendition.next();
  }

  /**
   * Open the table of contents.
   *
   * @return void
   */
  openTocPopover() {
    this.popoverController.config.set('mode', 'ios');
    const popover = this.popoverController.create(TocPopoverComponent, { toc: this.toc });
    popover.present({ ev: event });
  }

  /**
   * Go to the previous page.
   *
   * @return void
   */
  prev() {
    if (this.currentPage === 1) {
        return;
    }
    this.currentPage -= 1;
    this.rendition.prev();
  }

  /**
   * Toggle the toolbars.
   *
   * @return void
   */
  toggleToolbars()
  {
    this.showToolbars = !this.showToolbars;
  }

}
