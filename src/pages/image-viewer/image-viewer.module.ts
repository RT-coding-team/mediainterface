import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BaseViewerPageModule } from '@pages/base-viewer/base-viewer.module';
import { DownloadButtonModule } from '@components/download-button/download-button.module';
import { ImageViewerPage } from './image-viewer';

@NgModule({
  declarations: [
    ImageViewerPage,
  ],
  exports: [BaseViewerPageModule],
  imports: [
    BaseViewerPageModule,
    DownloadButtonModule,
    IonicPageModule.forChild(ImageViewerPage),
  ],
})
export class ImageViewerPageModule {}
