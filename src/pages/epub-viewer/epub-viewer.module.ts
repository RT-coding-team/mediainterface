import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BaseViewerPageModule } from '@pages/base-viewer/base-viewer.module';
import { DownloadButtonModule } from '@components/download-button/download-button.module';
import { EpubViewerPage } from './epub-viewer';

@NgModule({
  declarations: [
    EpubViewerPage,
  ],
  exports: [BaseViewerPageModule],
  imports: [
    BaseViewerPageModule,
    DownloadButtonModule,
    IonicPageModule.forChild(EpubViewerPage),
  ],
  providers: []
})
export class EpubViewerPageModule {}
