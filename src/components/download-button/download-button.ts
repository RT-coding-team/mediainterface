import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { take } from 'rxjs/operators/take';
import { saveAs } from 'file-saver';
import { Language } from '@models/language';
import { LanguageProvider } from '@providers/language/language';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';

/**
 * Download media.  Will display a loader while preparing the download.  Once completed,
 * it reports the download for stat tracking.
 *
 * @link https://www.illucit.com/en/angular/angular-5-httpclient-file-download-with-authentication/
 */
@Component({
  selector: 'download-button',
  templateUrl: 'download-button.html'
})
export class DownloadButtonComponent {

  /**
   * The path of the file to download
   */
  @Input() filePath = '';

  /**
   * Is the button located in the nav bar
   */
  @Input() inNavBar = false;

  /**
   * Fired once the file is downloaded.
   */
  @Output() onDownloaded = new EventEmitter<void>();

  /**
   * The media provider for the resource
   */
  @Input() mediaProvider = '';

  /**
   * The type of media for the resource
   */
  @Input() mediaType = '';

  /**
   * The slug for the resource
   */
  @Input() slug = '';

  /**
   * Is the file in the process of downloading?
   */
  isDownloading = false;

  constructor(
    private languageProvider: LanguageProvider,
    private statReporterProvider: StatReporterProvider,
  ) {
  }

  /**
   * Download the file
   *
   * @return void
   */
  downloadFile() {
    this.isDownloading = true;
    this.download();
    setTimeout(() => this.isDownloading = false, 2000);
    this.reportDownload().pipe(take(1)).subscribe();
  }

  /**
   * Download the file
   *
   * @return The blob of the file
   */
  private download() {
    const fileName = this.filePath.split('\\').pop().split('/').pop();
    saveAs(this.filePath, fileName);
  }

  /**
   * Report the download
   *
   * @return boolean Did it report successfully?
   */
  private reportDownload(): Observable<boolean> {
    if ((this.mediaProvider === '') && (this.mediaType === '') && (this.slug === '')) {
        return of(false);
    }
    return this.languageProvider.getLanguage()
      .pipe(
        mergeMap((lang: Language) => this.statReporterProvider.report(this.slug, 'download', lang.code, this.mediaProvider, this.mediaType))
      );
  }

}
