import { Component, ElementRef, ViewChild } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { DownloadFileProvider } from '@providers/download-file/download-file';
import { NavParamsDataStoreProvider } from '@providers/nav-params-data-store/nav-params-data-store';
import { ViewerItem } from '@interfaces/viewer-item.interface';

/**
 * A base viewer for the viewers to inherit from.  Stores common code.
 */
@Component({
  template: ''
})
export class BaseViewerPage {

  /**
   * A reference to the download link
   */
  @ViewChild('downloadLink') downloadLinkRef: ElementRef;

  /**
   * The item being viewed
   */
  protected item: ViewerItem = null;

  /**
   * The slug for the previous page
   */
  protected slug = '';

  constructor(
    protected dataStore: NavParamsDataStoreProvider,
    protected downloadFileProvider: DownloadFileProvider,
    protected navController: NavController,
    protected navParams: NavParams,
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
    this.item = this.navParams.get('item');
    if (typeof this.item === 'undefined') {
        // They refreshed the page. Get the data from the store.
        // @ts-ignore It needs to be implemented by child class
        this.dataStore.get(this.storageKey).pipe(take(1)).subscribe((data: string) => {
          if (data === '') {
            this.goBack();
          }
          this.item = JSON.parse(data);
          // @ts-ignore It needs to be implemented by child class
          this.loadFile();
        });
    } else {
      // @ts-ignore It needs to be implemented by child class
      this.dataStore.store(this.storageKey, JSON.stringify(this.item)).pipe(take(1)).subscribe(() => {
        // @ts-ignore It needs to be implemented by child class
        this.loadFile();
      });
    }
  }

  /**
   * Download the file.  To use this method, you need to add this to your template:
   *
   * ```
   * <a #downloadLink class="hidden"></a>
   * ```
   *
   * @return void
   * @link https://www.illucit.com/en/angular/angular-5-httpclient-file-download-with-authentication/
   */
  downloadFile() {
    const fileName = this.item.path.split('\\').pop().split('/').pop();
    this.downloadFileProvider.download(this.item.path).pipe(take(1)).subscribe((blob: any) => {
      const url = window.URL.createObjectURL(blob);
      const link = this.downloadLinkRef.nativeElement;
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  /**
   * Go back to the previous page
   *
   * @return void
   */
  goBack() {
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

}
