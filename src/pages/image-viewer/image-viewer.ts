import { Component, ViewChild } from '@angular/core';
import { IonicPage, Slides } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { BaseViewerPage } from '@pages/base-viewer/base-viewer';
import { BaseViewerPageInterface } from '@interfaces/base-viewer.interface';
import { ViewerItem } from '@interfaces/viewer-item.interface';

/**
 * A viewer for displaying images
 */
@IonicPage({
  name: 'image-viewer',
  segment: 'details/:slug/image-viewer',
})
@Component({
  selector: 'page-image-viewer',
  templateUrl: 'image-viewer.html',
})
export class ImageViewerPage extends BaseViewerPage implements BaseViewerPageInterface {

  /**
   * All the images to display
   */
  images: Array<ViewerItem> = [];

  /**
   * The currently selected item
   */
  item: ViewerItem = null;

  /**
   * The slides object
   */
  @ViewChild(Slides) slides: Slides;

  /**
   * Load the requested file
   *
   * @return void
   */
  loadFile() {
    this.item = this.firstItem;
    this.reportView(this.item).pipe(take(1)).subscribe();
    // Put photos in correct order starting with isFirst going to the last.
    const firstIndex = this.items.findIndex((item: ViewerItem)  =>  item.isFirst);
    const firstItems: Array<ViewerItem> = this.items.slice(0, firstIndex);
    const lastItems: Array<ViewerItem> = this.items.slice(firstIndex);
    this.images = [...lastItems, ...firstItems];
  }

  /**
   * Change the current item on slide change.
   *
   * @return void
   */
  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    this.item = this.images[currentIndex];
    this.reportView(this.item).pipe(take(1)).subscribe();
  }

}
