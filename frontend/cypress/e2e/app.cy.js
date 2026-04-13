/* eslint-env cypress */

describe('DroneWorld Application Flow', () => {
  const installMockOpfs = (win) => {
    const files = new Map();
    let directoryCreated = false;

    const createFileHandle = (name) => ({
      kind: 'file',
      createWritable: () =>
        Promise.resolve({
          write: (content) => {
            const existing = files.get(name) || { content: '', lastModified: Date.now() };
            existing.content = String(content);
            existing.lastModified = Date.now();
            files.set(name, existing);
            return Promise.resolve();
          },
          close: () => Promise.resolve(),
        }),
      getFile: () => {
        const existing = files.get(name);
        return Promise.resolve({
          name,
          size: existing.content.length,
          lastModified: existing.lastModified,
          text: () => Promise.resolve(existing.content),
        });
      },
    });

    const savedSettingsDirectory = {
      getFileHandle: (name, options = {}) => {
        if (!files.has(name)) {
          if (!options.create) {
            return Promise.reject(new Error('NotFoundError'));
          }
          files.set(name, { content: '', lastModified: Date.now() });
        }

        return Promise.resolve(createFileHandle(name));
      },
      removeEntry: (name) => {
        files.delete(name);
        return Promise.resolve();
      },
      async *entries() {
        for (const [name] of files.entries()) {
          yield [name, createFileHandle(name)];
        }
      },
    };

    const rootDirectory = {
      getDirectoryHandle: (name, options = {}) => {
        if (name !== 'saved-settings') {
          return Promise.reject(new Error(`Unexpected directory: ${name}`));
        }

        if (!directoryCreated && !options.create) {
          return Promise.reject(new Error('NotFoundError'));
        }

        directoryCreated = true;
        return Promise.resolve(savedSettingsDirectory);
      },
    };

    Object.defineProperty(win.navigator, 'storage', {
      configurable: true,
      value: {
        getDirectory: () => Promise.resolve(rootDirectory),
      },
    });
    // Leave URL.createObjectURL untouched. Cesium and browser worker setup rely on the real API.
  };

  const visitWizard = () => {
    cy.visit('/simulation', {
      onBeforeLoad(win) {
        installMockOpfs(win);
      },
    });
    cy.contains('Load Existing Configuration').should('be.visible');
  };

  const openPresetSelect = () => {
    cy.get('[data-testid="import-preset-select"]').click();
    cy.get('[role="listbox"]').should('be.visible');
  };

  const assertEnvironmentInputs = ({ latitude, longitude, altitude }) => {
    cy.get('[data-testid="environment-latitude-input"]', { timeout: 15000 }).should(
      'have.value',
      String(latitude),
    );
    cy.get('[data-testid="environment-longitude-input"]', { timeout: 15000 }).should(
      'have.value',
      String(longitude),
    );
    cy.get('[data-testid="environment-altitude-input"]', { timeout: 15000 }).should(
      'have.value',
      String(altitude),
    );
  };

  const assertDroneCoordinates = (droneIndex, { latitude, longitude, height }) => {
    cy.get(`[data-testid="drone-latitude-input-${droneIndex}"]`, { timeout: 15000 }).should(
      'have.value',
      String(latitude),
    );
    cy.get(`[data-testid="drone-longitude-input-${droneIndex}"]`, { timeout: 15000 }).should(
      'have.value',
      String(longitude),
    );
    cy.get(`[data-testid="drone-height-input-${droneIndex}"]`, { timeout: 15000 }).should(
      'have.value',
      String(height),
    );
  };

  const openDroneConfiguration = (droneName) => {
    cy.contains(droneName, { timeout: 15000 }).should('be.visible').click();
  };

  it('should handle direct /dashboard access without route state', () => {
    cy.visit('/dashboard');
    cy.contains('No Report Selected').should('be.visible');
    cy.contains('button', 'Go to Reports').click();
    cy.url().should('include', '/reports');
  });

  it('loads a bundled preset into the wizard, keeps imported values editable, and advances through the flow', () => {
    visitWizard();

    openPresetSelect();
    cy.contains('[role="option"]', 'Circular and Square Flight Mission in Windy Weather').click();
    cy.get('[data-testid="load-preset-button"]').click();

    cy.get('[data-testid="import-status"]').should(
      'contain.text',
      'Loaded preset "Circular and Square Flight Mission in Windy Weather" into the wizard.',
    );
    assertEnvironmentInputs({
      latitude: 42.1142,
      longitude: -87.9011,
      altitude: 208,
    });

    cy.contains('button', 'Next').click();
    openDroneConfiguration('Circle Drone');
    cy.get('[data-testid="drone-mission-select-0"]').should('contain.text', 'Circle');
    assertDroneCoordinates(0, {
      latitude: 42.1142,
      longitude: -87.9011,
      height: 30,
    });

    cy.get('[data-testid="drone-latitude-input-0"]').clear().type('42.1148');
    cy.get('[data-testid="drone-latitude-input-0"]').should('have.value', '42.1148');

    cy.contains('button', 'Next').click();
    cy.contains('button', 'Finish').should('be.visible');
    cy.contains('button', 'Back').click();
    cy.contains('button', 'Next').should('be.visible');
    openDroneConfiguration('Circle Drone');
    cy.get('[data-testid="drone-latitude-input-0"]').should('have.value', '42.1148');
  });

  it('loads a JSON file into the wizard and maps missions, environment fields, and drone coordinates', () => {
    visitWizard();

    cy.get('[data-testid="import-config-file-input"]').selectFile(
      'cypress/fixtures/import-task-payload.json',
      { force: true },
    );
    cy.get('[data-testid="selected-import-file"]').should(
      'contain.text',
      'import-task-payload.json',
    );
    cy.get('[data-testid="load-file-button"]').click();

    cy.get('[data-testid="import-status"]').should(
      'contain.text',
      'Loaded "import-task-payload.json" into the wizard.',
    );
    assertEnvironmentInputs({
      latitude: 36.2451,
      longitude: -115.2586,
      altitude: 215,
    });

    cy.contains('button', 'Next').click();

    openDroneConfiguration('Imported Survey Drone');
    cy.get('[data-testid="drone-mission-select-0"]').should('contain.text', 'Square');
    assertDroneCoordinates(0, {
      latitude: 36.2451,
      longitude: -115.2586,
      height: 28,
    });

    openDroneConfiguration('Imported Orbit Drone');
    cy.get('[data-testid="drone-mission-select-1"]').should('contain.text', 'Circle');
    assertDroneCoordinates(1, {
      latitude: 36.2453,
      longitude: -115.2584,
      height: 32,
    });

    cy.get('[data-testid="environment-altitude-input"]').should('not.exist');
    cy.contains('button', 'Back').click();
    cy.get('[data-testid="environment-altitude-input"]').clear().type('220');
    cy.get('[data-testid="environment-altitude-input"]').should('have.value', '220');
    cy.contains('button', 'Next').click();
    cy.contains('button', 'Next').click();
    cy.contains('button', 'Finish').should('be.visible');
  });

  it('should complete the full scenario configuration flow', () => {
    const backendUrl = Cypress.env('BACKEND_URL');
    const finalBackendUrl = backendUrl || 'http://localhost:5000';
    const waitForAnyBatchReport = (retries = 30) => {
      return cy.request(`${finalBackendUrl}/list-reports`).then((response) => {
        const reports = Array.isArray(response.body?.reports) ? response.body.reports : [];
        const hasBatch = reports.some((report) => (report.filename || '').includes('_Batch_'));

        if (hasBatch) return;
        if (retries <= 0) throw new Error('Timed out waiting for Batch report in list-reports');

        cy.wait(1000);
        return waitForAnyBatchReport(retries - 1);
      });
    };

    // Observe backend calls without stubbing so the test uses real mock-simulator output
    cy.intercept('GET', `${finalBackendUrl}/list-reports`).as('listReports');
    cy.intercept('GET', `${finalBackendUrl}/currentRunning`).as('getBackendStatus');
    cy.intercept('POST', `${finalBackendUrl}/addTask`).as('addTask');
    cy.intercept('POST', `${finalBackendUrl}/api/simulation/settings/preview`).as(
      'previewSettings',
    );
    cy.intercept('POST', `${finalBackendUrl}/list-folder-contents/*`).as('listFolderContents');

    // Step 1: Visit the landing page
    cy.visit('/', {
      onBeforeLoad(win) {
        installMockOpfs(win);
      },
    });

    // Wait for the initial backend reports call to complete
    cy.wait('@listReports');

    // Step 2: Wait for the "Get Started" button to be visible and click it
    // Material-UI Button with component={Link} renders as an <a> tag, not <button>
    // Using a flexible selector that works for both buttons and links
    cy.contains('Get Started').should('be.visible');
    cy.contains('Get Started').click();
    cy.url().should('include', '/home');
    cy.url().should('eq', `${Cypress.config().baseUrl || 'http://localhost:3000'}/home`);

    // Ensure Home page backend polling starts
    cy.wait('@getBackendStatus');

    // Step 3: Find and select "UAV-301: Circular Flight Mission in Windy Weather" from dropdown
    // Material-UI Select requires clicking the input field first
    cy.get('#req-id-select').click(); // Click to open the dropdown
    // Wait for dropdown menu to appear and select the option
    cy.get('[role="listbox"]').should('be.visible');
    cy.contains('[role="option"]', 'UAV-301: Circular Flight Mission in Windy Weather').click();

    // Step 4: Click "Start Scenario Configuration" button and verify navigation to /simulation
    cy.contains('button', 'Start Scenario Configuration').should('not.be.disabled');
    cy.contains('button', 'Start Scenario Configuration').click();
    cy.url().should('include', '/simulation');
    cy.url().should('eq', `${Cypress.config().baseUrl || 'http://localhost:3000'}/simulation`);

    // Step 5: Click the first "NEXT" button (moves from Environment Configuration to Mission Configuration)
    cy.contains('button', 'Next').click();

    // Step 6: Click the second "NEXT" button (moves from Mission Configuration to Test Configuration)
    cy.contains('button', 'Next').click();

    // Step 7: Verify that the "FINISH" button exists (should appear on the final step)
    cy.contains('button', 'Finish').should('exist');
    cy.contains('button', 'Finish').should('be.visible');

    // Step 8: Click "Finish", choose save-and-submit, and verify preview + submission both happen
    cy.contains('button', 'Finish').click();
    cy.contains('Save settings.json and task.json before submission?').should('be.visible');
    cy.contains('button', 'Yes, save both and submit').click();
    cy.wait('@previewSettings').then(({ request, response }) => {
      expect(request.body).to.exist;
      expect(response, 'preview settings response').to.exist;
      expect(response.statusCode).to.eq(200);
    });
    cy.wait('@addTask').then(({ request, response }) => {
      expect(request.body).to.exist;
      expect(response, 'addTask response').to.exist;
      expect(response.statusCode).to.eq(200);
    });
    cy.url().should('include', '/reports');
    cy.url().should('eq', `${Cypress.config().baseUrl || 'http://localhost:3000'}/reports`);

    // Step 9: Verify saved settings history UI contains the saved snapshot
    cy.get('nav').contains('a', 'Saved Settings').should('be.visible').click();
    cy.url().should('include', '/saved-settings');
    cy.contains('h4', 'Saved Settings').should('be.visible');
    cy.contains(/settings-\d{8}T\d{9}\.json/).should('be.visible');

    // Wait until the backend reports endpoint exposes at least one Batch report
    waitForAnyBatchReport();

    // Step 10: Verify "Reports" button exists in top nav, click it, and verify navigation to /reports
    cy.get('nav').contains('a', 'Reports').should('be.visible').click();
    cy.url().should('include', '/reports');
    cy.url().should('eq', `${Cypress.config().baseUrl || 'http://localhost:3000'}/reports`);
    cy.contains('h6', /^Batch\b/, { timeout: 10000 })
      .should('be.visible')
      .as('latestBatchTitle');

    // Step 11: Use the newest Batch tile to verify timestamp, local write, and download behavior
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.get('@latestBatchTitle')
      .closest('.MuiCard-root')
      .within(() => {
        cy.contains(/\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}/)
          .invoke('text')
          .then((ts) => cy.wrap(ts.trim()).as('batchTimestamp'));

        cy.get('svg[data-testid="DownloadForOfflineOutlinedIcon"]')
          .should('be.visible')
          .closest('button')
          .as('downloadButton');
      });

    cy.get('@batchTimestamp').then((ts) => {
      cy.contains(ts).should('be.visible');
      cy.task('verifyLocalMockReportFromTimestamp', { uiTimestamp: ts }).then((result) => {
        expect(result.found, result.reason || result.reportPath).to.eq(true);
      });
    });

    cy.get('@downloadButton').trigger('mouseover');
    cy.contains('[role="tooltip"]', 'Download report (.zip)').should('be.visible');
    cy.get('@downloadButton').click();
    cy.get('@windowOpen').should('have.been.called');

    // Step 12: Preview the newest batch report and verify dashboard navigation/rendering
    cy.get('@latestBatchTitle')
      .closest('.MuiCard-root')
      .within(() => {
        cy.contains('button', 'Preview').should('be.visible').click();
      });

    cy.wait('@listFolderContents').then(({ response }) => {
      expect(response, 'list-folder-contents response').to.exist;
      expect(response.statusCode).to.eq(200);
    });

    cy.url().should('include', '/dashboard');
    cy.contains(/Detailed Report/, { timeout: 10000 }).should('be.visible');
    cy.contains('Interactable HTMLs').should('be.visible');

    // Step 13: Use dashboard Back action and verify return to reports
    cy.contains('Back').should('be.visible').click();
    cy.url().should('include', '/reports');
  });
});
