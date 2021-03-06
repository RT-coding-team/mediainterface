import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators/catchError';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { Category } from '@models/category';
import { Episode } from '@models/episode';
import { Media } from '@models/media';
import { environment } from '@env';

/**
 * A provider to retrieve the details for a specific piece of media.
 */
@Injectable()
export class MediaDetailProvider {
  /**
   * The current language
   */
  private language = 'en';

  constructor(
    public http: HttpClient
  ) {}

  /**
   * get the details for the specific slug.
   *
   * @param  slug The slug
   * @return      void
   */
  get(slug: string): Observable<Media> {
    const path = `${environment.assetPath.replace('{LANG}', this.language)}data/${slug}.json`;
    return this.http.get(path).pipe(
      catchError(() => of(null)),
      map((response: any) => {
        if (!response) {
          return null;
        }
        const recommended = (response.hasOwnProperty('recommended')) ? response.recommended : false;
        const fileName = (response.hasOwnProperty('filename')) ? response.filename : '';
        const mimeType = (response.hasOwnProperty('mimeType')) ? response.mimeType : '';
        const mediaProvider = (response.hasOwnProperty('mediaProvider')) ? response.mediaProvider : '';
        let categories = [];
        if (response.categories.length > 0) {
          categories = response.categories.map((category) => new Category(category));;
        }
        const media = new Media(
          categories,
          response.desc,
          response.image,
          response.mediaType,
          response.slug,
          response.title,
          fileName,
          this.language,
          mimeType,
          recommended,
          response.tags,
          mediaProvider,
        );

        if (response.hasOwnProperty('episodes')) {
          response.episodes.forEach((data) => {
            const mediaProvider = (data.hasOwnProperty('mediaProvider')) ? data.mediaProvider : '';
            const episode = new Episode(
              data.desc,
              data.filename,
              data.image,
              data.mediaType,
              data.mimeType,
              data.slug,
              data.title,
              this.language,
              mediaProvider,
            );
            media.addEpisode(episode);
          });
        }

        return media;
      })
    );
  }

  /**
   * Set the language
   *
   * @param  language The two letter iso code
   * @return          void
   */
  setLanguage(language: string) {
    this.language = language;
  }

}
