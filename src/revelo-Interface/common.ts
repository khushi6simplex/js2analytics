/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Domains {
  name: string;
  label: string;
  type: string;
  description: string;
  propertyType: string;
  creationDate: string;
  typeInfo: TypeInfo;
  conceptModelName: string;
}
interface TypeInfo {
  values: Value[];
}
interface Value {
  label: string;
  value: string;
}
export interface Jurisdictions {
  name: string;
  type: string;
  user: string;
}

export interface DashboardConfig {
  layout: Layout;
}

export interface Layout {
  rows: Row[];
}

export interface Row {
  dimensions: Dimensions;
  columns: string[];
}

export interface Dimensions {
  height: string;
}

export interface Project {
  surveyId: number;
  name: string;
  label: string;
  conceptModelName: string;
  preferences: Preferences;
  dashboardConfig: DashboardConfig;
  phases: Phases;
  startDate: string;
  endDate: string;
  status: string;
  org: string;
  datasourceName: string;
  gisServerUrl: string;
}

interface Phases {}

interface Preferences {
  bufferDistance: number;
}
export const ProjectInitialValues: Project = {
  surveyId: 0,
  name: "",
  label: "",
  conceptModelName: "",
  preferences: {
    bufferDistance: 0,
  },
  dashboardConfig: {
    layout: {
      rows: [],
    },
  },
  phases: {},
  startDate: "",
  endDate: "",
  status: "",
  org: "",
  datasourceName: "",
  gisServerUrl: "",
};
export interface ObcmSnapShotDetails {
  conceptModelId: number;
  name: string;
  label: string;
  ownerName: string;
  ownerType: string;
  datasourceName: string;
  importMode: string;
  sourceCMNames: string;
  entities: Entity[];
  relations: Relation[];
  domains: number;
  org: string;
  gisServerUrl: string;
}

interface Relation {
  relationshipId: number;
  name: string;
  label: string;
  type: string;
  from: string;
  to: string;
  fromId: string;
  toId: string;
  properties: DomainValues;
  constraints: any[];
  conceptModel: string;
}

interface Entity {
  shortName: string;
  name: string;
  label: string;
  description: string;
  type: string;
  geometryType: string;
  w9IdPropertyName: string;
  labelPropertyName: string;
  abbreviation: string;
  isLocked: boolean;
  hasShadowTable: boolean;
  datasetName: string;
  propertyGroups: any[];
  domainValues: DomainValues;
  visualizations: DomainValues;
  infoTemplate: InfoTemplate;
  layerStyles: LayerStyles;
  miscProperties: MiscProperties;
  categories: DomainValues;
  depPropsGraph: DepPropsGraph;
  conceptModelName: string;
  properties: Property[];
}

interface Property {
  entityPropertyId: number;
  name: string;
  type: string;
  label: string;
  nature: string;
  isSystem: boolean;
  index: number;
  defaultValue: string;
  isExternal: boolean;
  enabled: boolean;
  isMandatory: boolean;
  isOmniSearchEnabled: boolean;
  derivativeExpression: DomainValues;
  metadata: DomainValues;
  entity: string;
}

interface DepPropsGraph {
  vertices: DomainValues;
  edges: any[];
}

interface MiscProperties {
  secondaryW9IdPropertyName: string;
  parentW9IdPropertyName: string;
  isReferenceEntity: boolean;
  updateDate: string;
}

interface LayerStyles {
  selectedRendererName: string;
  textStyle: TextStyle;
  renderers: Renderers;
}

interface Renderers {
  simple: Simple;
  uniqueValue: UniqueValue;
}

interface UniqueValue {
  name: string;
  type: string;
  style: Style3;
  enabled: boolean;
}

interface Style3 {
  field: Field;
  mapping: Mapping;
  colorRampIndex: number;
  minZoom: number;
  maxZoom: number;
}

interface Mapping {
  remainingValues: RemainingValues;
}

interface RemainingValues {
  fill: Fill;
  stroke: Stroke;
  points: number;
  radius: number;
  pointInfo: PointInfo;
}

interface Field {
  name: string;
  type: string;
}

interface Simple {
  name: string;
  type: string;
  style: Style2;
  enabled: boolean;
}

interface Style2 {
  fill: Fill;
  stroke: Stroke;
  points: number;
  radius: number;
  pointInfo: PointInfo;
  minZoom: number;
  maxZoom: number;
}

interface PointInfo {
  shape: string;
  other: Other;
}

interface Other {
  numPoints: number;
  path: string;
}

interface TextStyle {
  name: string;
  type: string;
  style: Style;
  enabled: boolean;
}

interface Style {
  font: string;
  textAttributeName: string;
  textAlign: string;
  textBaseline: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
  placement: string;
  maxAngle: number;
  overflow: string;
  minZoom: number;
  maxZoom: number;
  fill: Fill;
  stroke: Stroke;
  backgroundFill: Fill;
  backgroundStroke: Stroke;
  padding: number[];
}

interface Stroke {
  color: string;
  width: number;
}

interface Fill {
  color: string;
}

interface InfoTemplate {
  properties: Properties;
  childrenEntities: DomainValues;
}

interface Properties {
  controlPropertyName: string;
}

interface DomainValues {}
export const ObcmSnapShotDetailsIntialValues: ObcmSnapShotDetails = {
  conceptModelId: 0,
  name: "",
  label: "",
  ownerName: "",
  ownerType: "",
  datasourceName: "",
  importMode: "",
  sourceCMNames: "",
  entities: [],
  relations: [],
  domains: 0,
  org: "",
  gisServerUrl: "",
};
export interface Datasource {
  datasourceId: number;
  name: string;
  description: string;
  type: string;
  subType: string;
  isReadOnly: boolean;
  assignedCM: string;
  properties: Properties2;
  status: string;
  creationDate: string;
  org: string;
}

interface Properties2 {
  wkid: number;
  dbName: string;
  serverName: string;
  portNumber: string;
  userName: string;
  password: string;
  webServiceInfo: WebServiceInfo;
  version: string;
  schemaName: string;
}
interface WebServiceInfo {
  hostName: string;
  portNumber: string;
  servicesComponent: string;
  securityInfo: SecurityInfo;
  workspaceName: string;
  dataStoreName: string;
}

interface SecurityInfo {
  isSSLEnabled: boolean;
  authenticationType: string;
  authenticationInfo: AuthenticationInfo;
}

interface AuthenticationInfo {
  adminUserName: string;
  adminPassword: string;
}
export const dataSourceIntialValues: Datasource = {
  datasourceId: 0,
  name: "",
  description: "",
  type: "",
  subType: "",
  isReadOnly: false,
  assignedCM: "",
  properties: {
    wkid: 0,
    dbName: "",
    serverName: "",
    portNumber: "",
    userName: "",
    password: "",
    webServiceInfo: {
      hostName: "",
      portNumber: "",
      servicesComponent: "",
      securityInfo: {
        isSSLEnabled: false,
        authenticationType: "",
        authenticationInfo: {
          adminUserName: "",
          adminPassword: "",
        },
      },
      workspaceName: "",
      dataStoreName: "",
    },
    version: "",
    schemaName: "",
  },
  status: "",
  creationDate: "",
  org: "",
};
export interface Bill {
  billNumber: string;
  creationDate: string;
  dueDate: string;
  gstPercentage: number;
  paymentMode: string;
  amount: number;
  amountReceived: number;
  amountBalance: number;
  status: string;
  remarks: string;
  numBillItems: number;
  customerName: string;
}
