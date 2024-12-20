/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Datasource,
  Domains,
  Jurisdictions,
  ObcmSnapShotDetails,
  ObcmSnapShotDetailsIntialValues,
  Project,
  ProjectInitialValues,
  dataSourceIntialValues,
} from "./../../revelo-Interface/common.ts";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import ReveloUserInfo, {
  ReveloUserIntialValues,
} from "../../revelo-Interface/principalCallback.ts";
import {
  ProjectConceptModel,
  ProjectConceptModelInitialValues,
} from "../../revelo-Interface/conceptmodel.ts";

interface BillStatus {
  date: string;
  status: boolean;
  message: string;
  gracePeriod: boolean;
}
interface SpatialEntityVectorLayer {
  url: string;
  zIndex: number;
  featureProjection: string;
  properties: any;
  asEntityStyle: any;
}
interface ReveloUserInfoState {
  userInfo: ReveloUserInfo;
  projectConceptModel: ProjectConceptModel;
  dataSource: Datasource;
  domains: Domains[];
  jurisdictions: Jurisdictions[];
  obcmSnapShot: any;
  project: Project;
  obcmSnapShotDetails: ObcmSnapShotDetails;
  asEntity: any;
  userList: any;
  billStatus: BillStatus;
  spatialEntityVectorLayer: SpatialEntityVectorLayer[];
}
const initialState: ReveloUserInfoState = {
  userInfo: {
    ...ReveloUserIntialValues,
  },
  projectConceptModel: {
    ...ProjectConceptModelInitialValues,
  },
  dataSource: {
    ...dataSourceIntialValues,
  },
  domains: [],
  jurisdictions: [],
  obcmSnapShot: {},
  project: { ...ProjectInitialValues },
  obcmSnapShotDetails: { ...ObcmSnapShotDetailsIntialValues },
  asEntity: {},
  userList: [],
  billStatus: {
    date: "",
    status: false,
    message: "No Bill Due",
    gracePeriod: false,
  },
  spatialEntityVectorLayer: [],
};

export const reveloUserSlice = createSlice({
  name: "reveloUserInfo",
  initialState,
  reducers: {
    updateUserInfo(state, action: PayloadAction<ReveloUserInfo>) {
      state.userInfo = action.payload;
    },
    updateProjectConceptModel(
      state,
      action: PayloadAction<ProjectConceptModel>
    ) {
      state.projectConceptModel = action.payload;
    },
    updateDataSource(state, action: PayloadAction<Datasource>) {
      state.dataSource = action.payload;
    },
    updateDomains(state, action: PayloadAction<Domains>) {
      state.domains.push(action.payload);
    },
    updateJurisdictions(state, action: PayloadAction<Jurisdictions>) {
      state.jurisdictions.push(action.payload);
    },
    updateObcmSnapShot(state, action: PayloadAction<any>) {
      state.obcmSnapShot = action.payload;
    },
    updateProject(state, action: PayloadAction<Project>) {
      state.project = action.payload;
    },
    updateObcmSnapShotDetails(
      state,
      action: PayloadAction<ObcmSnapShotDetails>
    ) {
      state.obcmSnapShotDetails = action.payload;
    },
    updateAsEntity(state, action: PayloadAction<any>) {
      state.asEntity = action.payload;
    },
    updateUserList(state, action: PayloadAction<any>) {
      state.userList = action.payload;
    },
    updateBillStatus(state, action: PayloadAction<any>) {
      state.billStatus = action.payload;
    },
    updateSpatialVectorSource(state, action: PayloadAction<any>) {
      state.spatialEntityVectorLayer = action.payload;
    },
  },
});
export const {
  updateUserInfo,
  updateProjectConceptModel,
  updateDataSource,
  updateDomains,
  updateJurisdictions,
  updateObcmSnapShot,
  updateProject,
  updateObcmSnapShotDetails,
  updateAsEntity,
  updateUserList,
  updateBillStatus,
  updateSpatialVectorSource,
} = reveloUserSlice.actions;
export default reveloUserSlice.reducer;
