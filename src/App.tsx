import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { personOutline, ticketOutline, tvOutline, statsChartOutline } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';


/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Pages */
import Totem from './pages/Totem';
import Attendant from './pages/Attendant';
import Display from './pages/Display';
import Reports from './pages/Reports';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/totem">
            <Totem />
          </Route>
          <Route exact path="/attendant">
            <Attendant />
          </Route>
          <Route path="/display">
            <Display />
          </Route>
          <Route path="/reports">
            <Reports />
          </Route>
          <Route exact path="/">
            <Redirect to="/totem" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="totem" href="/totem">
            <IonIcon aria-hidden="true" icon={ticketOutline} />
            <IonLabel>Totem (Cliente)</IonLabel>
          </IonTabButton>

          <IonTabButton tab="attendant" href="/attendant">
            <IonIcon aria-hidden="true" icon={personOutline} />
            <IonLabel>Atendente</IonLabel>
          </IonTabButton>

          <IonTabButton tab="display" href="/display">
            <IonIcon aria-hidden="true" icon={tvOutline} />
            <IonLabel>Painel</IonLabel>
          </IonTabButton>

          <IonTabButton tab="reports" href="/reports">
            <IonIcon aria-hidden="true" icon={statsChartOutline} />
            <IonLabel>Relatórios</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
