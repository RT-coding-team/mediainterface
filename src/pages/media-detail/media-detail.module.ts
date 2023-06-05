import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MediaDetailPage } from './media-detail';
import { IonicPageModule } from 'ionic-angular';
import { AppFooterModule } from '@components/app-footer/app-footer.module';
import { DownloadButtonModule } from '@components/download-button/download-button.module';
import { MediaDetailProvider } from '@providers/media-detail/media-detail';

/**
 * Let's lazy load the pages.
 *
 * @link https://developer.school/ionic-3-lazy-loading-components/
 */
@NgModule({
    imports: [
      AppFooterModule,
      DownloadButtonModule,
      IonicPageModule.forChild(MediaDetailPage),
      TranslateModule,
    ],
    exports: [],
    declarations: [MediaDetailPage],
    providers: [
      MediaDetailProvider,
    ],
})
export class MediaDetailModule { }
