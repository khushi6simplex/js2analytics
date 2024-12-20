/* eslint-disable @typescript-eslint/no-explicit-any */
export default interface ReveloUserInfo {
  status: string;
  orgName: string;
  orgUXInfo: OrgUXInfo;
  orgHierarchy: OrgHierarchy;
  orgHQInfo: OrgHQInfo;
  numOBLayers: number;
  numExternalLayers: number;
  userInfo: UserInfo;
  trackingServersInfo: TrackingServersInfo[];
}

interface OrgHierarchy {
  vertices: any;
  edges: Edge[];
}

interface Edge {
  fromNodeName: string;
  toNodeName: string;
  properties: Properties;
}

interface Properties {
  name: string;
}

interface TrackingServersInfo {
  registryItemId: number;
  name: string;
  label: string;
  description: string;
  type: string;
  status: string;
  startTimeStamp: string;
  endTimeStamp: string;
  serverInfo: ServerInfo;
  securityInfo: SecurityInfo3;
}

interface SecurityInfo3 {
  tls: Tls;
  serverInfo: ServerInfo2;
}

interface ServerInfo2 {
  baseUrl: string;
  realmName: string;
  clientId: string;
  connectionInfo: ConnectionInfo;
}

interface ConnectionInfo {
  adminUserName: string;
  adminPassword: string;
  masterUserName: string;
  masterPassword: string;
}

interface Tls {
  enabled: boolean;
  certificateInfo: CertificateInfo;
}

interface CertificateInfo {
  fileName: string;
  filePath: string;
  password: string;
}

interface ServerInfo {
  baseUrl: string;
  connectionInfo: AuthenticationInfo;
}
interface Services {
  name: string;
  label: string;
  enabled: boolean;
}
interface UserInfo {
  userName: string;
  firstName: string;
  lastName: string;
  position: string;
  role: string;
  customerInfo: {
    name: string;
    bills: Bill[];
    customerUXInfo: {
      colors: {
        primaryColor: string;
        primaryDarkColor: string;
        accentColor: string;
        textColor: string;
        alertColor: string;
        successColor: string;
      };
      label: string;
      tagLine: string;
    };
    services: Services[];
    outputStore: {
      hostName: string;
      portNumber: string;
      servicesComponent: string;
      securityInfo: {
        isSSLEnabled: boolean;
        isEncrypted: boolean;
        encryptionInfo: {
          publicKey: string;
        };
        isAuthenticationEnabled: boolean;
        authenticationType: string;
        authenticationInfo: {
          adminUserName: string;
          adminPassword: string;
        };
      };
    };
  };
  hierarchy: Hierarchy;
  jurisdictions: Jurisdiction[];
  jurisdictionFilters: JurisdictionFilters;
  // datasource: Datasource; //not in use
  assignedProjects: AssignedProject[];
  privileges: Privileges;
  // analyticsDatasource: AnalyticsDatasource;
}
interface Bill {
  billNumber: string;
  dueDate: string;
  amountBalance: number;
  status: string;
}

interface Privileges {
  realtimeUpdates: RealtimeUpdates;
  viewer: Viewer;
  editor: Editor;
  dashboard: Viewer;
  users: Users;
  downloads: Downloads;
}

interface Downloads {
  enabled: boolean;
  features: Features4;
}

interface Features4 {
  attachments: Attachments;
  formats: Formats;
}

interface Formats {
  shapefile: Tracking;
  excel: Tracking;
  kml: Tracking;
  geojson: Tracking;
}

interface Attachments {
  images: Tracking;
  audio: Tracking;
  video: Tracking;
  documents: Tracking;
}

interface Users {
  enabled: boolean;
  features: Features3;
}

interface Features3 {
  creation: Tracking;
  updation: Tracking;
  deletion: Tracking;
}

interface Editor {
  webEnabled: boolean;
  mobileEnabled: boolean;
  features: Features2;
}

interface Features2 {
  geometry: Geometry2;
  attributes: Tracking;
}

interface Geometry2 {
  add: Tracking;
  update: Tracking;
  delete: Tracking;
}

interface Viewer {
  webEnabled: boolean;
  mobileEnabled: boolean;
  features: Phases;
}

interface RealtimeUpdates {
  webEnabled: boolean;
  mobileEnabled: boolean;
  features: Features;
}

interface Features {
  tracking: Tracking;
  messaging: Tracking;
  dataChanges: Tracking;
}

interface Tracking {
  enabled: boolean;
}

interface AssignedProject {
  name: string;
  label: string;
  phases: Phases;
}

interface Phases {}

interface AuthenticationInfo {
  adminUserName: string;
  adminPassword: string;
}

interface JurisdictionFilters {
  state: string;
  division: string;
  circle: string;
}

interface Hierarchy {
  name: string;
  role: string;
  jurisdiction: Jurisdiction;
  parent: Parent;
}

interface Parent {
  name: string;
  role: string;
  jurisdiction: Jurisdiction;
}

interface Jurisdiction {
  name: string;
  type: string;
}

interface OrgHQInfo {
  type: string;
  properties: Properties;
  geometry: Geometry;
}

interface Geometry {
  type: string;
  coordinates: number[];
}

interface Properties {
  name: string;
}

interface OrgUXInfo {
  personas: Personas;
  views: Views;
  colors: Colors;
}

interface Colors {
  primaryColor: string;
  primaryDarkColor: string;
  accentColor: string;
  textColor: string;
  alertColor: string;
  successColor: string;
}

interface Views {
  toc: Toc;
  map: Toc;
  infoPanel: Toc;
  history: Toc;
  attributeTable: Toc;
  editorToolbar: Toc;
}

interface Toc {
  webModuleName: string;
  mobileModuleName: string;
}

interface Personas {
  dataCollector: DataCollector;
  supervisor: DataCollector;
  analyst: Analyst;
  decisionMaker: DecisionMaker;
}

interface DecisionMaker {
  perspectives: Perspectives3;
}

interface Perspectives3 {
  home: Home;
  viewer: Home;
  dashboard: Home;
  mappr: Analyzr;
}

interface Analyst {
  perspectives: Perspectives2;
}

interface Perspectives2 {
  home: Home;
  viewer: Home;
  dashboard: Home;
  analyzr: Analyzr;
  mappr: Analyzr;
}

interface Analyzr {
  views: any[];
}

interface DataCollector {
  perspectives: Perspectives;
}

interface Perspectives {
  home: Home;
  viewer: Home;
  editor: Home;
  dashboard: Home;
}

interface Home {
  views: string[];
}

export const ReveloUserIntialValues: ReveloUserInfo = {
  status: "",
  orgName: "",
  orgUXInfo: {
    personas: {
      dataCollector: {
        perspectives: {
          home: { views: [""] },
          viewer: { views: [""] },
          editor: { views: [""] },
          dashboard: { views: [""] },
        },
      },
      supervisor: {
        perspectives: {
          home: { views: [""] },
          viewer: { views: [""] },
          editor: { views: [""] },
          dashboard: { views: [""] },
        },
      },
      analyst: {
        perspectives: {
          home: { views: [""] },
          viewer: { views: [""] },
          dashboard: { views: [""] },
          analyzr: { views: [] },
          mappr: { views: [] },
        },
      },
      decisionMaker: {
        perspectives: {
          home: { views: [""] },
          viewer: { views: [""] },
          dashboard: { views: [""] },
          mappr: { views: [] },
        },
      },
    },
    views: {
      toc: { webModuleName: "", mobileModuleName: "" },
      map: { webModuleName: "", mobileModuleName: "" },
      infoPanel: { webModuleName: "", mobileModuleName: "" },
      history: { webModuleName: "", mobileModuleName: "" },
      attributeTable: { webModuleName: "", mobileModuleName: "" },
      editorToolbar: { webModuleName: "", mobileModuleName: "" },
    },
    colors: {
      primaryColor: "",
      primaryDarkColor: "",
      accentColor: "",
      textColor: "",
      alertColor: "",
      successColor: "",
    },
  },
  orgHQInfo: {
    type: "",
    properties: { name: "" },
    geometry: { type: "", coordinates: [0, 0] },
  },
  orgHierarchy: {
    vertices: {},
    edges: [],
  },
  numOBLayers: 0,
  numExternalLayers: 0,
  userInfo: {
    userName: "",
    firstName: "",
    lastName: "",
    position: "",
    role: "",
    customerInfo: {
      services: [
        {
          name: "",
          label: "",
          enabled: false,
        },
      ],
      name: "",
      customerUXInfo: {
        colors: {
          primaryColor: "",
          primaryDarkColor: "",
          accentColor: "",
          textColor: "",
          alertColor: "",
          successColor: "",
        },
        tagLine: "",
        label: "",
      },
      bills: [
        {
          billNumber: "",
          dueDate: "",
          amountBalance: 0,
          status: "paid",
        },
      ],
      outputStore: {
        hostName: "",
        portNumber: "",
        servicesComponent: "",
        securityInfo: {
          isSSLEnabled: false,
          isEncrypted: false,
          encryptionInfo: {
            publicKey: "",
          },
          isAuthenticationEnabled: false,
          authenticationType: "",
          authenticationInfo: {
            adminUserName: "",
            adminPassword: "",
          },
        },
      },
    },
    hierarchy: {
      name: "",
      role: "",
      jurisdiction: { name: "", type: "" },
      parent: {
        name: "",
        role: "",
        jurisdiction: { name: "", type: "" },
      },
    },
    jurisdictions: [{ name: "", type: "" }],
    jurisdictionFilters: { state: "", division: "", circle: "" },
    assignedProjects: [
      {
        name: "",
        label: "",
        phases: {},
      },
    ],
    privileges: {
      realtimeUpdates: {
        webEnabled: false,
        mobileEnabled: false,
        features: {
          tracking: { enabled: false },
          messaging: { enabled: false },
          dataChanges: { enabled: false },
        },
      },
      viewer: {
        webEnabled: false,
        mobileEnabled: false,
        features: {
          tracking: { enabled: false },
          messaging: { enabled: false },
          dataChanges: { enabled: false },
        },
      },
      editor: {
        webEnabled: false,
        mobileEnabled: false,
        features: {
          geometry: {
            add: { enabled: false },
            update: { enabled: false },
            delete: { enabled: false },
          },
          attributes: { enabled: false },
        },
      },
      dashboard: {
        webEnabled: false,
        mobileEnabled: false,
        features: {
          tracking: { enabled: false },
          messaging: { enabled: false },
          dataChanges: { enabled: false },
        },
      },
      users: {
        enabled: false,
        features: {
          creation: { enabled: false },
          updation: { enabled: false },
          deletion: { enabled: false },
        },
      },
      downloads: {
        enabled: false,
        features: {
          attachments: {
            images: { enabled: false },
            audio: { enabled: false },
            video: { enabled: false },
            documents: { enabled: false },
          },
          formats: {
            shapefile: { enabled: false },
            excel: { enabled: false },
            kml: { enabled: false },
            geojson: { enabled: false },
          },
        },
      },
    },
  },
  trackingServersInfo: [
    {
      registryItemId: 0,
      name: "",
      label: "",
      description: "",
      type: "",
      status: "",
      startTimeStamp: "",
      endTimeStamp: "",
      serverInfo: {
        baseUrl: "",

        connectionInfo: {
          adminUserName: "",
          adminPassword: "",
        },
      },
      securityInfo: {
        tls: {
          enabled: false,
          certificateInfo: {
            fileName: "",
            filePath: "",
            password: "",
          },
        },
        serverInfo: {
          baseUrl: "",
          realmName: "",
          clientId: "",
          connectionInfo: {
            adminUserName: "",
            adminPassword: "",
            masterUserName: "",
            masterPassword: "",
          },
        },
      },
    },
  ],
};
