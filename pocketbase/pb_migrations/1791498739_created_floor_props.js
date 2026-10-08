/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_1567773776",
        "hidden": false,
        "id": "relation3952415295",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "restaurant",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_397918867",
        "hidden": false,
        "id": "relation4054224987",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "floor_plan",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select2581241972",
        "maxSelect": 1,
        "name": "prop_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "stage",
          "bathroom",
          "window",
          "staircase",
          "wall",
          "plant",
          "other"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text245846248",
        "max": 0,
        "min": 0,
        "name": "label",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3578368839",
        "max": 0,
        "min": 0,
        "name": "display_name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select3710975960",
        "maxSelect": 1,
        "name": "shape",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "circle",
          "square",
          "rect",
          "booth_u",
          "booth_half_u",
          "bar"
        ]
      },
      {
        "hidden": false,
        "id": "number3219281744",
        "max": null,
        "min": null,
        "name": "seats",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json2202873605",
        "maxSize": 0,
        "name": "chair_positions",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number2363233923",
        "max": null,
        "min": null,
        "name": "x",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number4225443349",
        "max": null,
        "min": null,
        "name": "y",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2350531887",
        "max": null,
        "min": null,
        "name": "width",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number4115522831",
        "max": null,
        "min": null,
        "name": "height",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number696031473",
        "max": null,
        "min": null,
        "name": "rotation",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool3929661506",
        "name": "is_interactive",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool2009979044",
        "name": "visible_to_customers",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool2725759466",
        "name": "is_available",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool3624639942",
        "name": "is_reserved",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      }
    ],
    "id": "pbc_2041508074",
    "indexes": [],
    "listRule": "",
    "name": "floor_props",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2041508074");

  return app.delete(collection);
})
