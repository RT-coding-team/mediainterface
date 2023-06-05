import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { FileUtilityProvider } from '@providers/file-utility/file-utility';
import { LanguageProvider } from '@providers/language/language';
import { NavParamsDataStoreProvider } from '@providers/nav-params-data-store/nav-params-data-store';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';
import { BaseViewerPage } from '@pages/base-viewer/base-viewer';
import { BaseViewerPageInterface } from '@interfaces/base-viewer.interface';
import { ViewerItem } from '@interfaces/viewer-item.interface';

/**
 * A viewer for text files.
 */
@IonicPage({
  name: 'text-viewer',
  segment: 'details/:slug/text-viewer',
})
@Component({
  selector: 'page-text-viewer',
  templateUrl: 'text-viewer.html',
})
export class TextViewerPage extends BaseViewerPage implements BaseViewerPageInterface {

  /**
   * The content of the text file
   */
  content = 'Loading..';

  /**
   * The item we are viewing
   */
  item: ViewerItem = null;

  constructor(
    protected dataStore: NavParamsDataStoreProvider,
    protected fileUtilityProvider: FileUtilityProvider,
    protected navController: NavController,
    protected navParams: NavParams,
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
   * load the requested file
   *
   * @return void
   */
  loadFile() {
    this.item = this.firstItem;
    this.reportView(this.item).pipe(take(1)).subscribe();
    this.fileUtilityProvider.read(this.item.filePath).pipe(take(1)).subscribe((content: string) =>  this.content = content.replace(/(?:\r\n|\r|\n)/g, '<br>'));
  }

}
