import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { of } from 'rxjs/observable/of';
import { take } from 'rxjs/operators/take';
import { AvPlayerDataStoreProvider } from '@providers/av-player-data-store/av-player-data-store';
import { AvPlayerItem } from '@interfaces/av-player-item.interface';
import { LanguageProvider } from '@providers/language/language';
import { StatReporterProvider } from '@providers/stat-reporter/stat-reporter';
import { Language } from '@models/language';

/**
 * An audio and video player.
 */
@IonicPage({
  name: 'av-player',
  segment: 'details/:slug/media-player',
})
@Component({
  selector: 'page-av-player',
  templateUrl: 'av-player.html',
})
export class AvPlayerPage {

    /**
     * The audio player element
     */
    @ViewChild('audioPlayer') audioPlayer: ElementRef;

    /**
     * The audio player poster
     */
    @ViewChild('audioPoster') audioPoster: ElementRef;

    /**
     * The video player element
     */
    @ViewChild('videoPlayer') videoPlayer: ElementRef;

    /**
     * The current playing item
     */
    current: AvPlayerItem = null;

    /**
     * Is the item playing?
     */
    isPlaying = true;

    /**
     * Should we show the overlay?
     */
    showOverlay = false;

    /**
     * The callback triggered when the audio/video ended.
     */
    private mediaEndedCallback: any = null;

    /**
     * The callback triggered when the audio/video is paused.
     */
    private mediaPauseCallback: any = null;

    /**
     * The callback triggered when the audio/video is started.
     */
    private mediaPlayCallback: any = null;

    /**
     * The callback triggered when the audio/video is hovered/tapped.
     */
    private mediaEngagedCallback: any = null;

    /**
     * The slug for the previous page
     */
    slug = '';

    constructor(
      private dataStore: AvPlayerDataStoreProvider,
      private languageProvider: LanguageProvider,
      private navController: NavController,
      private navParams: NavParams,
      private statReporterProvider: StatReporterProvider,
      private viewController: ViewController,
    ) {
    }

    /**
     * Ionic view lifecycle
     *
     * @return void
     */
    ionViewWillEnter() {
      const items = this.navParams.get('items');
      this.slug = this.navParams.get('slug');
      this.dataStore.init(items).pipe(
        take(1),
        mergeMap((current: AvPlayerItem)  =>  this.reportView(current)),
      ).subscribe((current: AvPlayerItem) => {
        if (!current) {
          this.goBack();
        } else {
          this.current = current;
        }
      });
    }

    /**
     * Ionic view lifecycle
     *
     * @return void
     */
    ionViewDidEnter() {
      this.mediaEndedCallback = () => this.videoDidEnd();
      this.mediaPauseCallback = () => this.isPlaying = false;
      this.mediaPlayCallback = () => this.isPlaying = true;
      this.mediaEngagedCallback = (event) => this.displayOverlay(event);
      this.videoPlayer.nativeElement.addEventListener('play', this.mediaPlayCallback, false);
      this.audioPlayer.nativeElement.addEventListener('play', this.mediaPlayCallback, false);
      this.videoPlayer.nativeElement.addEventListener('pause', this.mediaPauseCallback, false);
      this.audioPlayer.nativeElement.addEventListener('pause', this.mediaPauseCallback, false);
      this.videoPlayer.nativeElement.addEventListener('ended', this.mediaEndedCallback, false);
      this.audioPlayer.nativeElement.addEventListener('ended', this.mediaEndedCallback, false);

      this.videoPlayer.nativeElement.addEventListener('touchstart', this.mediaEngagedCallback, false);
      this.videoPlayer.nativeElement.addEventListener('mouseenter', this.mediaEngagedCallback, false);
      this.audioPoster.nativeElement.addEventListener('touchstart', this.mediaEngagedCallback, false);
      this.audioPoster.nativeElement.addEventListener('mouseenter', this.mediaEngagedCallback, false);
      this.audioPlayer.nativeElement.addEventListener('touchstart', this.mediaEngagedCallback, false);
      this.audioPlayer.nativeElement.addEventListener('mouseenter', this.mediaEngagedCallback, false);
    }

    /**
     * Ionic view lifecycle
     *
     * @return void
     */
    ionViewWillLeave() {
      if (this.mediaEndedCallback) {
        this.videoPlayer.nativeElement.removeEventListener('ended', this.mediaEndedCallback);
        this.audioPlayer.nativeElement.removeEventListener('ended', this.mediaEndedCallback);
        this.mediaEndedCallback = null;
      }
      if (this.mediaPauseCallback) {
        this.videoPlayer.nativeElement.removeEventListener('pause', this.mediaPauseCallback);
        this.audioPlayer.nativeElement.removeEventListener('pause', this.mediaPauseCallback);
        this.mediaPauseCallback = null;
      }
      if (this.mediaPlayCallback) {
        this.videoPlayer.nativeElement.removeEventListener('play', this.mediaPlayCallback);
        this.audioPlayer.nativeElement.removeEventListener('play', this.mediaPlayCallback);
        this.mediaPlayCallback = null;
      }
      if (this.mediaEngagedCallback) {
        this.videoPlayer.nativeElement.removeEventListener('touchstart', this.mediaEngagedCallback);
        this.videoPlayer.nativeElement.removeEventListener('mouseenter', this.mediaEngagedCallback);
        this.audioPoster.nativeElement.removeEventListener('touchstart', this.mediaEngagedCallback);
        this.audioPoster.nativeElement.removeEventListener('mouseenter', this.mediaEngagedCallback);
        this.audioPlayer.nativeElement.removeEventListener('touchstart', this.mediaEngagedCallback);
        this.audioPlayer.nativeElement.removeEventListener('mouseenter', this.mediaEngagedCallback);
        this.mediaEngagedCallback = null;
      }
    }

    /**
     * Go back to the previous view.
     *
     * @return void
     */
    goBack() {
      this.dataStore.clear();
      if (this.navController.canGoBack()) {
        this.navController.pop();
      } else if (this.slug !== '') {
        this.navController.push(
          'media-details',
          { slug: this.slug },
          {
            animate: true,
            direction: 'back',
          },
        ).then(() => {
          // Remove us from backstack
          this.navController.remove(this.viewController.index);
          this.navController.insert(0, 'HomePage');
        });
      } else {
        this.navController.goToRoot({
          animate: true,
        });
      }
    }

    /**
     * Is this the first item in the list?
     *
     * @return yes|no
     */
    isFirstItem(): boolean {
      return this.dataStore.onFirstItem();
    }

    /**
     * Is this the last item in the list?
     *
     * @return yes|no
     */
    isLastItem(): boolean {
      return this.dataStore.onLastItem();
    }

    /**
     * Play the next episode
     *
     * @return void
     */
    nextEpisode() {
      this.dataStore.next().pipe(
        take(1),
        mergeMap((next: AvPlayerItem)  =>  this.reportView(next)),
      ).subscribe((next: AvPlayerItem) => {
        if (next == null) {
          this.goBack();
        } else {
          this.current = next;
        }
      });
    }

    /**
     * Pause the video
     *
     * @return void
     */
    pause() {
      this.isPlaying = false;
      if (this.current.type === 'video') {
        this.videoPlayer.nativeElement.pause();
      } else {
        this.audioPlayer.nativeElement.pause();
      }
    }

    /**
     * Play the video
     *
     * @return void
     */
    play() {
      this.isPlaying = true;
      if (this.current.type === 'video') {
        this.videoPlayer.nativeElement.play();
      } else {
        this.audioPlayer.nativeElement.play();
      }
    }

    /**
     * Play the previous video.
     *
     * @return void
     */
    previousEpisode() {
      this.dataStore.previous().pipe(
        take(1),
        mergeMap((prev: AvPlayerItem)  =>  this.reportView(prev)),
      ).subscribe((prev: AvPlayerItem) => {
        if (prev == null) {
          this.goBack();
        } else {
          this.current = prev;
        }
      });
    }

    /**
     * Display the overlay for a set amount of seconds.
     *
     * @param   event   the event that triggered it
     * @return void
     */
    displayOverlay(event) {
      event.preventDefault();
      if (this.showOverlay) {
        return;
      }
      this.showOverlay = true;
      setTimeout(() => this.showOverlay = false, 3000);
    }

    /**
     * The video did end.
     *
     * @return void
     */
    videoDidEnd() {
      this.isPlaying = false;
      if (this.dataStore.hasMore()) {
          setTimeout(() => {
            this.nextEpisode();
          }, 2000);
      }
    }

    /**
     * Report the viewing of an item
     *
     * @param  item The item being viewed
     * @return      The item received
     */
    private reportView(item: AvPlayerItem): Observable<AvPlayerItem> {
      if (!item) {
        return of(null);
      }
      return this.languageProvider.getLanguage().pipe(
        mergeMap((lang: Language) =>  this.statReporterProvider.report(item.slug, 'view', lang.code, item.provider, item.type).pipe(map(() =>  item)))
      );
    }

}
