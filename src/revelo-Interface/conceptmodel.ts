export interface ProjectConceptModel {
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
  description: string;
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
  type: string;
  geometryType: string;
  w9IdPropertyName: string;
  labelPropertyName: string;
  abbreviation: string;
  isLocked: boolean;
  hasShadowTable: boolean;
  datasetName: string;
  propertyGroups: PropertyGroup[];
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
  description?: string;
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
  renderers: Renderers;
  textStyle?: TextStyle;
}

interface TextStyle {
  name: string;
  type: string;
  style: Style5;
  enabled: boolean;
}

interface Style5 {
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

interface Renderers {
  simple?: Simple;
  uniqueValue?: UniqueValue;
  heatmap?: Heatmap;
  cluster?: Cluster;
}

interface Cluster {
  name: string;
  type: string;
  style: Style4;
  enabled: boolean;
}

interface Style4 {
  fill: Fill;
  stroke: Stroke;
  points: number;
  radius: number;
  minZoom: number;
  maxZoom: number;
}

interface Heatmap {
  name: string;
  type: string;
  style: Style3;
  enabled: boolean;
}

interface Style3 {
  gradient: string;
  radius: number;
  field: string;
  minZoom: number;
  maxZoom: number;
}

interface UniqueValue {
  name: string;
  type: string;
  style: Style2;
  enabled: boolean;
}

interface Style2 {
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
  style: Style;
  enabled: boolean;
}

interface Style {
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

interface PropertyGroup {
  name: string;
  label: string;
  index: number;
  propertyNames: string[];
}
export const ProjectConceptModelInitialValues: ProjectConceptModel = {
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
