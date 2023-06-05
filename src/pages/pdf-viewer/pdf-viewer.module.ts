import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PdfViewerPage } from './pdf-viewer';
import { BaseViewerPageModule } from '@pages/base-viewer/base-viewer.module';
import { DownloadButtonModule } from '@components/download-button/download-button.module';

@NgModule({
  declarations: [
    PdfViewerPage,
  ],
  exports: [BaseViewerPageModule],
  imports: [
    BaseViewerPageModule,
    DownloadButtonModule,
    IonicPageModule.forChild(PdfViewerPage),
  ],
  providers: []
})
export class PdfViewerPageModule {}
