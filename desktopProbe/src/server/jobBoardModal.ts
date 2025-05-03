import { JobBoardModalResponse } from '@/lib/types';
import { BrowserWindow, WebContentsView } from 'electron';

import { JobSite } from '../../../supabase/functions/_shared/types';

/**
 * Class used to render a WebContentsView on top of the main window
 * to navigate to a job board and get back it's html content.
 */
export class JobBoardModal {
  private _mainWindow?: BrowserWindow;
  private _searchView?: WebContentsView;
  private _resizeListener?: () => void;
  private _jobSite?: JobSite;

  /**
   * Set the parent main window.
   */
  setMainWindow(mainWindow: BrowserWindow) {
    this._mainWindow = mainWindow;
  }

  /**
   * Open the job board modal.
   */
  open(jobSite: JobSite) {
    if (!this._mainWindow) {
      throw new Error('Main window is not set');
    }
    if (this._searchView) {
      throw new Error('Search view is already open');
    }

    this._searchView = new WebContentsView();
    this._searchView.webContents.loadURL(jobSite.urls[0]);

    // set the bounds of the view to be the same as the main window
    this._updateSearchViewBounds();

    // Add resize listener
    this._resizeListener = this._updateSearchViewBounds.bind(this);
    this._mainWindow.on('resize', this._resizeListener);

    this._mainWindow.contentView.addChildView(this._searchView);

    // Set the job site
    this._jobSite = jobSite;
  }

  /**
   * Update the search view bounds to match the main window
   */
  private _updateSearchViewBounds() {
    if (this._mainWindow && this._searchView) {
      const contentBounds = this._mainWindow.getContentBounds();
      // Start 50px from the top, maintain the width, and adjust the height accordingly
      this._searchView.setBounds({
        x: 0, // Start at left edge of content area
        y: 50, // 50px from top of content area
        width: contentBounds.width,
        height: contentBounds.height - 50,
      });
    }
  }

  /**
   * Get the html content and current url of the job board modal and close it.
   */
  async finish(): Promise<JobBoardModalResponse> {
    if (!this._searchView) {
      throw new Error('Search view is not set');
    }
    if (!this._jobSite) {
      throw new Error('Job site is not set');
    }

    const html = await this._searchView.webContents.executeJavaScript('document.documentElement.outerHTML');
    const title = await this._searchView.webContents.executeJavaScript('document.title');
    const url = this._searchView.webContents.getURL();

    this.close();

    return {
      url,
      title,
      html,
      site: this._jobSite,
    };
  }

  /**
   * Close the job board modal.
   * This is used when the user cancels the modal.
   */
  close() {
    // Remove the resize listener
    if (this._resizeListener && this._mainWindow) {
      this._mainWindow.removeListener('resize', this._resizeListener);
      this._resizeListener = undefined;
    }

    if (this._searchView) {
      this._mainWindow.contentView.removeChildView(this._searchView);
      this._searchView.webContents.close();
      this._searchView = undefined;
    }
  }
}
