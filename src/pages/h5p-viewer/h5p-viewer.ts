import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { H5P } from 'h5p-standalone';
import { BaseViewerPage } from '@pages/base-viewer/base-viewer';
import { BaseViewerPageInterface } from '@interfaces/base-viewer.interface';
import { ViewerItem } from '@interfaces/viewer-item.interface';

/**
 * A viewer for h5p documents
 */
@IonicPage({
  name: 'h5p-viewer',
  segment: 'details/:slug/h5p-viewer',
})
@Component({
  selector: 'page-h5p-viewer',
  templateUrl: 'h5p-viewer.html',
})
export class H5pViewerPage extends BaseViewerPage implements BaseViewerPageInterface {

  /**
   * The h5p viewer
   */
  @ViewChild('viewer') viewer: ElementRef;

  /**
   * The currently selected item
   */
  item: ViewerItem = null;

  /**
   * Load the requested file
   *
   * @return void
   */
  loadFile() {
    this.item = this.firstItem;
    console.log(this.item);
    this.reportView(this.item).pipe(take(1)).subscribe();
    const options = {
      h5pJsonPath: this.item.filePath,
      frameJs: 'assets/h5p/frame.bundle.js',
      frameCss: '/assets/h5p/h5p.css',
      fullScreen: false,
    };
    new H5P(this.viewer.nativeElement, options);
  }

}
