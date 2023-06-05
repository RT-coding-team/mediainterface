import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BaseViewerPageModule } from '@pages/base-viewer/base-viewer.module';
import { DownloadButtonModule } from '@components/download-button/download-button.module';
import { FileUtilityProvider } from '@providers/file-utility/file-utility';
import { TextViewerPage } from './text-viewer';

@NgModule({
  declarations: [
    TextViewerPage,
  ],
  exports: [BaseViewerPageModule],
  imports: [
    BaseViewerPageModule,
    DownloadButtonModule,
    IonicPageModule.forChild(TextViewerPage),
  ],
  providers: [
    FileUtilityProvider,
  ],
})
export class TextViewerPageModule {}
