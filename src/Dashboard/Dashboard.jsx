import { Button, Select, Space, Spin, Typography } from "antd";
import { useRef, useState } from "react";
import { useAppSelector } from "../Redux/store/store";
import cytoscape from "cytoscape";
import "./DashBoard.css";
import { DownloadOutlined, RedoOutlined } from "@ant-design/icons";
import ReveloTable from "./ReveloTable/ReveloTable";
import Header from "./header/Header";

const Dashboard = () => {
  const [jurisdiction, setJurisdiction] = useState();
  const [selectedValues, setSelectedValues] = useState({});
  const [selectedOption, setSelectedOption] = useState({});
  const [disabledPanels, setDisabledPanels] = useState({});
  const [childWidget, setChildWidget] = useState(new Map());
  const descendantValuesMap = useRef(new Map());
  const {
    obcmSnapShotDetails,
    obcmSnapShot,
    userInfo,
    jurisdictions,
  } = useAppSelector((state) => state.reveloUserInfo);
  let immediateChildEntityNode;
  let descendantsMap = new Map();
  let ancestorsMap = new Map();
  let widgetsMap = new Map(childWidget);
  let defaultvalueRef = useRef();


  const buildCompoundCYGraph = (dataGraph) => {
    const tempCyGraph = CyCMGraph(dataGraph);
    const roots = tempCyGraph.elements().roots();
    const parentChildCyGraph = cytoscape({});
    let rootNode = null;
    roots.forEach((root) => {
      rootNode = root;
      let elementsToAdd = [];
      elementsToAdd = [
        {
          group: "nodes",
          data: { parent: null, ...rootNode.data() },
        },
      ];
      parentChildCyGraph.add(elementsToAdd);
      extractAndAddChildren(rootNode, parentChildCyGraph);
    });
    return parentChildCyGraph;
  };
  const extractAndAddChildren = (node, graph) => {
    let outgoers = node.outgoers();
    let elementsToAdd = [];
    for (let i = 0; i < outgoers.length; i++) {
      let outgoer = outgoers[i];
      let targetNode = outgoer.target();
      if (targetNode) {
        let targetNodeData = targetNode.data();
        if (targetNodeData) {
          let targetData = { parent: node.data().id, ...targetNodeData };
          elementsToAdd.push({
            group: "nodes",
            data: targetData,
          });

          let edgeData = outgoer.data();
          elementsToAdd.push({
            group: "edges",
            data: {
              id: targetData.parent + "_" + targetNodeData.id,
              source: targetData.parent,
              target: targetNodeData.id,
              fromId: edgeData.fromId,
              toId: edgeData.toId,
            },
          });
          if (elementsToAdd.length > 0) {
            graph.add(elementsToAdd);
          }
          extractAndAddChildren(targetNode, graph);
        }
      }
    }
  };
  const CyCMGraph = (graphData) => {
    const cyNodes = [];
    const cyEdges = [];
    const vertices = graphData.entities;
    vertices.forEach((vertex) => {
      const vertexName = vertex.shortName;
      cyNodes.push({ data: { id: vertexName, ...vertex } });
    });
    const edges = graphData.relations;
    edges.forEach((edge) => {
      cyEdges.push({
        data: {
          id: edge.name,
          source: edge.from,
          target: edge.to,
          ...edge,
        },
      });
    });
    const cy = cytoscape({
      elements: {
        nodes: cyNodes,
        edges: cyEdges,
      },
    });
    return cy;
  };
  const obCMCYGraph = buildCompoundCYGraph(obcmSnapShotDetails);
  const hierarchyInfo = userInfo.userInfo.hierarchy;
  const jurisdictionName = jurisdictions[0]?.name;
  const jurisdictionType = jurisdictions[0]?.type;
  const obcmGraphNodes = obCMCYGraph.nodes();
  const assignedEntityNode = obCMCYGraph.nodes(
    "[id='" + jurisdictionType + "']"
  );
  ancestorsMap.set(jurisdictionType, jurisdictionName);
  const getAncestors = (
    entityNode,
    hierarchyInfo,
    ancestorsMap
  ) => {
    let incomers = entityNode.incomers();
    if (incomers.length === 2) {
      let parentNode = incomers[1];
      if (parentNode) {
        let jurisdiction = hierarchyInfo.jurisdiction;
        ancestorsMap.set(jurisdiction.type, jurisdiction.name);
        getAncestors(parentNode, hierarchyInfo.parent, ancestorsMap);
      }
    }
  };
  getAncestors(assignedEntityNode, hierarchyInfo.parent, ancestorsMap);
  const getDescendants = (entityNode) => {
    let outgoers = entityNode.outgoers();
    if (outgoers.length === 2) {
      let childNode = outgoers[1];
      if (childNode) {
        let childEntity = childNode.data();
        descendantsMap.set(childEntity.name, childEntity);
        getDescendants(childNode);
      }
    }
  };
  const outgoers = assignedEntityNode.outgoers();
  if (outgoers.length === 2) {
    immediateChildEntityNode = outgoers[1];
  }
  if (immediateChildEntityNode) {
    getDescendants(immediateChildEntityNode);
  }
  const extractValueOptionsFromObject = (
    entityName,
    ancestorsMap
  ) => {
    let values = [
      {
        value: "all",
        label: "All",
        selected: true,
      },
    ];
    let snapShotObject = obcmSnapShot;
    let rootEntityNode = obCMCYGraph.nodes().first();
    const updatedSnapshot = extractRecursively(
      rootEntityNode,
      jurisdictionType,
      entityName,
      ancestorsMap,
      snapShotObject
    );
    if (updatedSnapshot) {
      let entityValuesObject = updatedSnapshot[entityName];
      if (entityValuesObject) {
        let entityValues = Object.keys(entityValuesObject);
        if (entityValues.length > 0) {
          entityValues.forEach(function (entityValue) {
            values.push({
              value: entityValue,
              label: entityValue,
              selected: false,
            });
          });
        }
      }
    }
    return values;
  };

  const createEntitySelectorPanel = (value, obcmEntity) => {
    let options = [];
    let selectedValue = value;
    if (ancestorsMap.has(obcmEntity?.name) === true) {
      var jurisdictionName = ancestorsMap.get(obcmEntity.name);
      if (jurisdictionName) {
        defaultvalueRef.current = `${obcmEntity.name}`;
      }
      options = [
        {
          value: jurisdictionName,
          label: jurisdictionName,
        },
      ];
    } else if (descendantsMap.has(obcmEntity?.name) === true) {
      const retrievedValue = descendantValuesMap.current?.get(obcmEntity?.name);
      if (retrievedValue !== undefined) {
        retrievedValue.forEach(function (option) {
          options.push({
            value: option.value,
            label: option.label,
            selected: true,
          });
        });
      } else {
        options = [
          {
            value: "all",
            label: "All",
            selected: true,
          },
        ];
      }
    } else {
      options = extractValueOptionsFromObject(
        immediateChildEntityNode.data().name,
        ancestorsMap
      );
    }
    selectedValue = jurisdictionName ? jurisdictionName : value;
    let existingSelectObject = widgetsMap.get(obcmEntity?.name);
    if (existingSelectObject) {
      selectedValue = existingSelectObject.value || value;
    }
    let selectobject = {
      entityName: obcmEntity?.name,
      options: options,
      value: selectedValue,
    };
    widgetsMap.set(obcmEntity?.name, selectobject);
    return options;
  };

  const populateChildWidget = (
    value,
    parentEntityName,
    selectOptions,
    index,
    parent
  ) => {
    const previousSelectedValue = selectedValues[parent];
    setSelectedOption({
      name: value === "all" ? previousSelectedValue : value,
      type: parentEntityName,
    });
    let options = [];
    let parentNode = obCMCYGraph.nodes("[id='" + parentEntityName + "']");
    let parentEntityValue = value;
    const updatedValues = {
      ...selectedValues,
      [parentEntityName]: parentEntityValue,
    };
    const currentIndex = selectOptions.findIndex(
      (item) => item.value === parentEntityValue
    );
    const updatedDisabled = { ...disabledPanels };
    setSelectedValues(updatedValues);
    setDisabledPanels(updatedDisabled);
    let disableNext = false;
    if (parentEntityValue === "all") {
      for (let i = currentIndex + 1; i < selectOptions.length; i++) {
        options = [
          {
            label: "All",
            selected: true,
            value: "all",
          },
        ];
        if (disableNext || updatedValues[selectOptions[i].name] === "all") {
          updatedValues[selectOptions[i].name] = "All";
          updatedDisabled[selectOptions[i].name] = true;
          disableNext = true;
        } else {
          updatedDisabled[selectOptions[i].name] = false;
        }
      }
    } else {
      options = [
        {
          label: parentEntityValue,
          selected: true,
          value: parentEntityValue,
        },
      ];
      for (let i = currentIndex + 1; i < selectOptions.length; i++) {
        if (updatedValues[selectOptions[i].name] === "all") {
          updatedValues[selectOptions[i].name] = options;
          updatedDisabled[selectOptions[i].name] = true;
        } else {
          updatedDisabled[selectOptions[i].name] = false;
        }
      }
      let childEntity, childNode;
      var outgoers = parentNode.outgoers();
      if (outgoers.length === 2) {
        childNode = outgoers[1];
        if (childNode) {
          childEntity = childNode.data();
        }
      }
      if (!childEntity) {
        return;
      }
      let childEntityName = childEntity.name;
      let ancestorsMap = new Map();
      ancestorsMap.set(parentEntityName, parentEntityValue);
      parentNode.ancestors().forEach(function (ancestorElement) {
        if (ancestorElement.group() === "nodes") {
          var ancestorEntity = ancestorElement.data();
          var ancestorWidget = widgetsMap.get(ancestorEntity.name);
          ancestorsMap.set(ancestorEntity.name, ancestorWidget.value);
        }
      });
      setChildWidget(widgetsMap);
      let values = [
        {
          value: "all",
          label: "All",
        },
      ];
      let snapShotObject = obcmSnapShot;
      let rootEntityNode = obCMCYGraph.nodes().first();
      let updatedSnapshot = extractRecursively(
        rootEntityNode,
        parentEntityName,
        childEntityName,
        ancestorsMap,
        snapShotObject
      );
      if (updatedSnapshot) {
        var entityValuesObject = updatedSnapshot[childEntityName];
        if (entityValuesObject) {
          var entityValues = Object.keys(entityValuesObject);
          if (entityValues.length > 0) {
            entityValues.forEach(function (entityValue) {
              values.push({
                value: entityValue,
                label: entityValue,
              });
            });
          }
        }
      }
      descendantValuesMap.current.set(childEntityName, values);
    }
  };
  const extractRecursively = (
    currentEntityNode,
    assignedEntityName ,
    targetEntityName,
    ancestorsMap,
    snapShotObject 
  ) => {
    const currentEntityName = currentEntityNode.data().name;
    if (Object.prototype.hasOwnProperty.call(snapShotObject, currentEntityName)) {
      const currentEntityValue = ancestorsMap.get(currentEntityName);
      const dataObject = snapShotObject[currentEntityName][currentEntityValue];
      if (dataObject) {
        snapShotObject = dataObject["children"];
        if (currentEntityName !== assignedEntityName) {
          const outgoers = currentEntityNode.outgoers();
          if (outgoers.length === 2) {
            const parentNode = outgoers[1];
            if (parentNode) {
              snapShotObject = extractRecursively(
                parentNode,
                assignedEntityName,
                targetEntityName,
                ancestorsMap,
                snapShotObject
              );
            }
          }
        }
      } else {
        return null;
      }
    }
    return snapShotObject;
  };
  const handleReset = () => {
    const resetValues = {};
    Object.keys(selectedValues).forEach((panel) => {
      resetValues[panel] = "All";
    });
    setSelectedValues(resetValues);
    setJurisdiction(undefined);
    setSelectedOption(undefined);
  };

  return (
    <>
      <div className="main-dashBoard-wrapper">
          <Header />
          <div style={{marginTop: "5%", height:"85vh", width: "100%", display: "flex", }}>
            <ReveloTable />
          </div>
      </div>
    </>
  );
};

export default Dashboard;
