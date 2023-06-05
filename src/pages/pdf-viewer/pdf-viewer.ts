import { Component, ElementRef, NgZone, TemplateRef, ViewChild, ViewContainerRef, ViewRef } from '@angular/core';
import { Content, IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import * as PDFJS from 'pdfjs-dist/webpack.js';
import { PDFPageProxy, PDFPageViewport, PDFRenderTask } from 'pdfjs-dist';
import { BaseViewerPage } from '@pages/base-viewer/base-viewer';
import { BaseViewerPageInterface } from '@interfaces/base-viewer.interface';
import { PagePosition } from '@interfaces/page-position.interface';
import { PageState } from '@interfaces/page-state.interface';
import { LanguageProvider } from '@providers/language/language';
import { NavParamsDataStoreProvider } from '@providers/nav-params-data-store/nav-params-data-store';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';
import { ViewerItem } from '@interfaces/viewer-item.interface';

/**
 * A PDF viewer
 * @link https://www.saninnsalas.com/using-pdf-js-with-ionic-3-x/
 */
@IonicPage({
  name: 'pdf-viewer',
  segment: 'details/:slug/pdf-viewer',
})
@Component({
  selector: 'page-pdf-viewer',
  templateUrl: 'pdf-viewer.html',
})
export class PdfViewerPage extends BaseViewerPage implements BaseViewerPageInterface {

  /**
   * The canvas size
   */
  canvasSize: any = {
    height: 0,
    width: 0,
  };

  /**
   * The item we are viewing
   */
  item: ViewerItem = null;

  /**
   * Keep track of the paging
   */
  pageState: PageState = {
    alteredScale: false,
    current: 1,
    lastLoaded: 1,
    scale: 1,
    scaleRate: .25,
    total: 1,
  };

  /**
   * The proxy to the PDFDocument in the worker tread.
   */
  pdfDocument: PDFJS.PDFDocumentProxy;

  /**
   * The PDFJS instance
   */
  PDFJSViewer = PDFJS;

  /**
   * The content view child.
   */
  @ViewChild(Content) content: Content;

  /**
   * The template for each page of the PDF
   */
  @ViewChild('pageCanvasTemplate') pageCanvasTemplate: TemplateRef<any>;

  /**
   * The view container that holds the pages
   */
  @ViewChild('pagesContainer', { read: ViewContainerRef }) pagesContainer: ViewContainerRef;

  /**
   * The viewer
   */
  @ViewChild('viewer') viewerRef: ElementRef;

  /**
   * The slug for the previous page
   */
  slug = '';

  /**
   * Are we scrolling to the next or previous view?
   */
  private isAutoScrolling = false;

  /**
   * Are we refreshing the page?
   */
  private isRefreshing = false;

  /**
   * Holds information about each page's position on the view.
   */
  private pagePositions: Array<PagePosition> = [];

  /**
   * Our subscription to scroll events
   */
  private scrollStream$: any = null;

  constructor(
    protected dataStore: NavParamsDataStoreProvider,
    protected navController: NavController,
    protected navParams: NavParams,
    protected viewController: ViewController,
    protected zone: NgZone,
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
  }

  /**
   * Load the requested file
   *
   * @return void
   */
  loadFile() {
    this.item = this.firstItem;
    this.reportView(this.item).pipe(take(1)).subscribe();
    /**
     * Check if the view is larger than the new PDF page.  If so, load additional pages
     */
    this.loadPdf().then(() => {
      const first = this.pagePositions[0];
      const promises = [];
      let height = first.height;
      let pageNum = 2;
      while (height <= this.content.contentHeight) {
        promises.push(this.loadPage(pageNum));
        pageNum += 1;
        // Every page should be same height
        height += first.height;
      }
    });
  }

  /**
   * Ionic LifeCycle the view will enter
   *
   * @return void
   */
  ionViewWillEnter() {
    /**
     * We need to keep track of which page the user is viewing
     */
    this.scrollStream$ = this.content.ionScroll.subscribe((event: any) => {
      if (!event) {
        return;
      }
      const current = this.pagePositions.find((page: PagePosition) => (event.scrollTop >= page.top) && (event.scrollTop <= page.bottom));
      if (!current) {
        return;
      }
      this.zone.run(() => this.pageState.current = current.pageNumber);
    });
  }

  /**
   * Ionic LifeCycle the view will leave
   *
   * @return void
   */
  ionViewWillLeave() {
    if (this.scrollStream$) {
      this.scrollStream$.unsubscribe();
      this.scrollStream$ = null;
    }
  }

  /**
   * Can we still decrease the scale?
   *
   * @return yes|no
   */
  canDecreaseScale(): boolean {
    return ((this.pageState.scale - this.pageState.scaleRate) > 0);
  }

  /**
   * Decrease the current scale.
   *
   * @return void
   */
  decreaseScale() {
    if ((!this.canDecreaseScale()) || (this.doingWork())) {
        return;
    }
    this.pageState.scale = this.pageState.scale - this.pageState.scaleRate;
    this.pageState.alteredScale = true;
    this.refreshPdf();
  }

  /**
   * What do we do when the user scrolls?
   *
   * @param  infiniteScroll The infinite scroll event
   * @return                void
   */
  doInfinite(infiniteScroll) {
    if (this.pageState.lastLoaded === this.pageState.total) {
      infiniteScroll.complete();
      return;
    }
    const next = this.pageState.lastLoaded + 1;
    this.loadPage(next).then(() => infiniteScroll.complete());
  }

  /**
   * Increase the current scale.
   *
   * @return void
   */
  increaseScale() {
    if (this.doingWork()) {
      return;
    }
    this.pageState.scale = this.pageState.scale + this.pageState.scaleRate;
    this.pageState.alteredScale = true;
    this.refreshPdf();
  }

  /**
   * Are we on the first page?
   *
   * @return yes|no
   */
  isFirstPage(): boolean {
    return (this.pageState.current === 1);
  }

  /**
   * Are we on the last page?
   *
   * @return yes|no
   */
  isLastPage(): boolean {
    return (this.pageState.current >= this.pageState.total);
  }

  /**
   * Load the next page
   *
   * @return void
   */
  goToNextPage() {
    if ((this.isLastPage()) || (this.doingWork())) {
      // prevent hitting the button twice
      return;
    }
    const page = this.pageState.current + 1;
    const existing: PagePosition = this.pagePositions.find((data: PagePosition) => data.pageNumber === page);
    if (existing) {
      this.isAutoScrolling = true;
      this.content.scrollTo(0, existing.top + 10, 3000)
        .then(() => this.isAutoScrolling = false)
        .catch(() => this.isAutoScrolling = false);
      return;
    } else {
      this.loadPage(page).then(() => {
        const data: PagePosition = this.pagePositions.find((data: PagePosition) => data.pageNumber === page);
        this.isAutoScrolling = true;
        this.content.scrollTo(0, data.top + 10, 3000)
          .then(() => this.isAutoScrolling = false)
          .catch(() => this.isAutoScrolling = false);
      });
    }
  }

  /**
   * Load the previous page.
   *
   * @return void
   */
  goToPreviousPage() {
    if ((this.isFirstPage()) || (this.doingWork())) {
      // prevent hitting the button twice
      return;
    }
    const page = this.pageState.current - 1;
    const existing: PagePosition = this.pagePositions.find((data: PagePosition) => data.pageNumber === page);
    // Page should already exist!
    this.isAutoScrolling = true;
    this.content.scrollTo(0, existing.top, 3000)
      .then(() => this.isAutoScrolling = false)
      .catch(() => this.isAutoScrolling = false);
  }

  /**
   * Load the PDF.
   *
   * @return The promise and whethe it loaded
   */
  loadPdf(): Promise<boolean> {
    return this.PDFJSViewer.getDocument(this.item.filePath)
      .promise.then(pdf => {
        this.pdfDocument = pdf;
        this.zone.run(() => this.pageState.total = pdf.numPages);
        return this.loadPage(1);
      }).catch(e => {
        console.error(e);
        return false;
      });
  }

  /**
   * Load the given page.
   *
   * @param  pageNum The page number
   * @return         void
   */
  loadPage(pageNum: number = 1) {
    let pdfPage: PDFPageProxy;
    const pageView: ViewRef = this.pageCanvasTemplate.createEmbeddedView({ pageNum: pageNum });
    pageView.detectChanges();
    this.pagesContainer.insert(pageView);
    return this.pdfDocument.getPage(pageNum).then(thisPage => {
      pdfPage = thisPage;
      return this.renderPage(pdfPage, pageNum);
    }).then(() => {
      this.pageState.lastLoaded = pageNum;
      this.addPageToPagePositions(pageNum);
      return pdfPage;
    });
  }

  /**
   * Add the page to the page positions array
   *
   * @param  pageNum The page number
   * @return         void
   */
  private addPageToPagePositions(pageNum: number): PagePosition {
    const pageEle = document.getElementById(`page-${pageNum}`);
    const top = pageEle.offsetTop;
    const bottom = (pageEle.offsetTop + pageEle.offsetHeight);
    const position: PagePosition = {
      bottom: bottom,
      height: pageEle.offsetHeight,
      pageNumber: pageNum,
      top: top,
    };
    this.pagePositions.push(position);
    return position;
  }

  /**
   * Are we doing work right now?
   *
   * @return yes|no
   */
  private doingWork(): boolean {
    return (this.isAutoScrolling) && (this.isRefreshing);
  }

  /**
   * Refresh and redraw the PDF
   *
   * @return void
   */
  private refreshPdf() {
    if (this.doingWork()) {
      return;
    }
    this.isRefreshing = true;
    const current = this.pageState.current;
    // empty the view
    this.pagesContainer.clear();
    // empty pagePositions
    this.pagePositions = [];
    const promises = [];
    for (let i = 1; i <= current; i++) {
      promises.push(this.loadPage(i));
    }
    // load pages up to current
    Promise.all(promises).then(() => {
      // reload page positions
      for (let i = 1; i <= current; i++) {
        this.addPageToPagePositions(i);
      }
      this.isRefreshing = false;
    });
  }

  /**
   * Render a single page
   *
   * @param   pdfPage Page to render
   * @param   pageNum The page number
   * @return         void
   */
  private async renderPage(pdfPage: PDFPageProxy, pageNum: number) {
    let canvasContext: CanvasRenderingContext2D;
    const viewer = this.viewerRef.nativeElement as HTMLElement;
    const canvas = viewer.querySelector(`#page-${pageNum} .page-canvas`) as HTMLCanvasElement;
    const textContainer = viewer.querySelector(`#page-${pageNum} .text-container`) as HTMLElement;

    canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvasContext.imageSmoothingEnabled = false;
    canvasContext.webkitImageSmoothingEnabled = false;
    canvasContext.mozImageSmoothingEnabled = false;
    canvasContext.oImageSmoothingEnabled = false;

    let scale = this.pageState.scale;

    if ((pageNum === 1) && (!this.pageState.alteredScale)) {
      /**
       * We need to only dynamically change scale to device screen size the first time.  Once content
       * is added the unscaledViewport.width becomes larger and warps the scale.
       */
      const unscaledViewport = pdfPage.getViewport({ scale: this.pageState.scale }) as PDFPageViewport;
      scale = viewer.offsetWidth / unscaledViewport.width;
      this.pageState.scale = scale;
    }

    const viewport = pdfPage.getViewport({ scale: scale }) as PDFPageViewport;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    this.zone.run(() => {
      this.canvasSize.width = viewport.width;
      this.canvasSize.height = viewport.height;
    });

    //fix for 4K
    if (window.devicePixelRatio > 1) {
      let canvasWidth = canvas.width;
      let canvasHeight = canvas.height;

      canvas.width = canvasWidth * window.devicePixelRatio;
      canvas.height = canvasHeight * window.devicePixelRatio;
      canvas.style.width = canvasWidth + "px";
      canvas.style.height = canvasHeight + "px";

      this.zone.run(() => {
        this.canvasSize.width = canvasWidth;
        this.canvasSize.height = canvasHeight;
      });

      canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // THIS RENDERS THE PAGE !!!!!!
    let renderTask: PDFRenderTask = pdfPage.render({
        canvasContext,
        viewport,
    });
    let container = textContainer;
    return renderTask.promise.then(() => pdfPage.getTextContent()).then((textContent) => {
      let textLayer: HTMLElement;
      textLayer = textContainer;
      while (textLayer.lastChild) {
          textLayer.removeChild(textLayer.lastChild);
      }
      this.PDFJSViewer.renderTextLayer({
          textContent,
          container,
          viewport,
          textDivs: []
      });
      return true;
    });
  }

}
