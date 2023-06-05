import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController } from 'ionic-angular';
import { take } from 'rxjs/operators/take';
import { LanguageProvider } from '@providers/language/language';
import { MediaDetailProvider } from '@providers/media-detail/media-detail';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';
import { Episode } from '@models/episode';
import { Language } from '@models/language';
import { Media } from '@models/media';
import { AvPlayerItem } from '@interfaces/av-player-item.interface';
import { LanguagePopoverComponent } from '@components/language-popover/language-popover';
import { ViewerItem } from '@interfaces/viewer-item.interface';

/**
 * The detail page for a specific piece of media.
 */
@IonicPage({
  defaultHistory: ['HomePage'],
  name: 'media-details',
  segment: 'details/:slug',
})
@Component({
  selector: 'page-media-detail',
  templateUrl: 'media-detail.html',
})
export class MediaDetailPage {

  /**
   * The slug of the media that is currently being downloaded
   */
  downloadingSlug = '';

  /**
   * The current media
   */
  media: Media = null;

  /**
   * The current slug
   */
  slug = '';

  /**
   * A list of available viewers. (av-player does not get added)
   */
  private availableViewers = ['epub-viewer', 'h5p-viewer', 'image-viewer', 'pdf-viewer', 'text-viewer'];

  /**
   * Which media players currently have a viewer
   */
  private mediaTypesWithViewers = ['pdf', 'epub', 'video', 'audio', 'text', 'image', 'h5p', 'html'];

  /**
   * The current language
   */
  private currentLanguage: Language = null;

  /**
   * Our stream for tracking changes on the language
   */
  private languageOnChangeStream$: any = null;

  constructor(
    private languageProvider: LanguageProvider,
    private mediaDetailProvider: MediaDetailProvider,
    private navController: NavController,
    private navParams: NavParams,
    private popoverController: PopoverController,
    private statReporterProvider: StatReporterProvider,
  ) {}

  /**
   * Life cycle for Ionic
   *
   * @return void
   */
  ionViewWillEnter() {
    this.slug = this.navParams.get('slug');
    this.languageProvider.getLanguage().pipe(take(1)).subscribe((lang: Language) => this.loadData(lang));
    this.languageOnChangeStream$ = this.languageProvider.onLanguageChange.subscribe((lang: Language) => this.loadData(lang));
  }

  /**
   * Ionic LifeCycle the view will leave
   *
   * @return void
   */
  ionViewWillLeave() {
    if (this.languageOnChangeStream$) {
      this.languageOnChangeStream$.unsubscribe();
      this.languageOnChangeStream$ = null;
    }
  }

  /**
   * Is this a book?
   *
   * @param  mediaType The type of media
   * @return           yes|no
   */
  isBook(mediaType: string): boolean {
    return (['pdf', 'epub'].indexOf(mediaType) !== -1);
  }

  /**
   * Has a player?
   *
   * @param  mediaType The type of media
   * @return           yes|no
   */
  hasViewer(mediaType: string, isEpisode: boolean = false): boolean {
    return (this.mediaTypesWithViewers.indexOf(mediaType) !== -1);
  }


  /**
   * Get the play icon based on the media type
   * @param  mediaType The type of media
   * @return           The icon name
   */
  playIcon(mediaType: string): string {
    if (this.isBook(mediaType)) {
      return 'book';
    }
    if (mediaType === 'html') {
      return 'exit';
    }
    if (mediaType === 'text') {
      return 'document';
    }
    return 'play';
  }

  /**
   * Play the provided episode
   *
   * @param  episode The episode to play
   * @return         void
   */
  playEpisode(current: Episode) {
    let items: Array<AvPlayerItem|ViewerItem> = null;
    if ((current.mediaType === 'video') || (current.mediaType === 'audio')) {
      items = <Array<AvPlayerItem>> this.media.episodes.map((episode: Episode) => {
        const playFirst = (episode.title === current.title);
        return {
          url: episode.filePath,
          playFirst: playFirst,
          posterUrl: episode.imagePath,
          provider: episode.mediaProvider,
          slug: episode.slug,
          type: episode.mediaType,
        };
      });
    } else {
      items = <Array<ViewerItem>> this.media.episodes.map((episode: Episode) => {
        const playFirst = (episode.title === current.title);
        return {
          downloadPath: episode.downloadPath,
          filePath: episode.filePath,
          isFirst: playFirst,
          provider: episode.mediaProvider,
          slug: episode.slug,
          title: episode.title,
          type: episode.mediaType,
        };
      });
    }
    this.openViewer(current, items);
  }

  /**
   * Play the current media
   *
   * @return void
   */
  playMedia() {
    if (!this.media) {
      return;
    }
    let item: AvPlayerItem|ViewerItem = null;
    if ((this.media.mediaType === 'video') || (this.media.mediaType === 'audio')) {
      item = <AvPlayerItem> {
        url: this.media.filePath,
        playFirst: true,
        posterUrl: this.media.imagePath,
        provider: this.media.mediaProvider,
        slug: this.media.slug,
        type: this.media.mediaType,
      };
    } else {
      item = <ViewerItem> {
        downloadPath: this.media.downloadPath,
        filePath: this.media.filePath,
        isFirst: true,
        provider: this.media.mediaProvider,
        slug: this.media.slug,
        title: this.media.title,
        type: this.media.mediaType,
      };
    }
    this.openViewer(this.media, [item]);
  }

  /**
   * Open the language popover
   *
   * @param   event The event that triggered it
   * @return void
   */
  openLanguagePopover(event) {
    this.popoverController.config.set('mode', 'ios');
    const popover = this.popoverController.create(LanguagePopoverComponent);
    popover.present({ ev: event });
  }

  /**
   * Determine which viewer to use
   *
   * @param  mediaType The media type of the resource
   * @return           The viewer name or empty string
   */
  private getViewer(mediaType: string): string {
    const viewer = `${mediaType}-viewer`;
    return (this.availableViewers.indexOf(viewer) !== -1) ? viewer : '';
  }

  /**
   * Load the page data
   *
   * @param   language  The language to load
   * @return void
   */
  private loadData(language: Language) {
    if ((this.currentLanguage) && (language.text === this.currentLanguage.text)) {
      return;
    }
    this.currentLanguage = language;
    this.mediaDetailProvider.setLanguage(language.code);
    this.mediaDetailProvider
      .get(this.slug)
      .pipe(take(1))
      .subscribe((media: Media) => this.media = media);
  }

  /**
   * Open the appropriate viewer for the media.
   * NOTE: We only report on HTML because it opens a new window.  All view reporting
   * should be added to viewer.  This allows recording multiple views.
   *
   * @param  resource   The resource that we are retrieving
   * @param  items      An array of items in order of play
   * @return void
   */
  private openViewer(resource: Media|Episode, items: Array<AvPlayerItem|ViewerItem>) {
    const viewer = this.getViewer(resource.mediaType);
    if ((resource.mediaType === 'video') || (resource.mediaType === 'audio')) {
      this.navController.push('av-player', { items: items, slug: resource.slug });
    } else if (resource.mediaType === 'html') {
      this.statReporterProvider.report(resource.slug, 'view', this.currentLanguage.code, '', resource.mediaType).pipe(
        take(1)
      ).subscribe(() => window.open(resource.filePath));
    } else if (viewer !== '') {
      this.navController.push(viewer, { items: items, slug: resource.slug });
    }
  }

}
