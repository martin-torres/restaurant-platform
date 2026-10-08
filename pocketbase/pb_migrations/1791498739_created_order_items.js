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
        "collectionId": "pbc_3527180448",
        "hidden": false,
        "id": "relation4113142680",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "order",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2382559930",
        "hidden": false,
        "id": "relation3612661072",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "menu_item",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
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
        "hidden": false,
        "id": "number2856609550",
        "max": null,
        "min": null,
        "name": "seat_number",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number2683508278",
        "max": null,
        "min": null,
        "name": "quantity",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1106926802",
        "max": null,
        "min": null,
        "name": "unit_price",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number163230955",
        "max": null,
        "min": null,
        "name": "total_price",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "new",
          "in_progress",
          "ready",
          "picking_up",
          "delivered",
          "cancelled"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2301119865",
        "hidden": false,
        "id": "relation2263269840",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assigned_staff",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text18589324",
        "max": 0,
        "min": 0,
        "name": "notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json3493198471",
        "maxSize": 0,
        "name": "options",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "select2671376561",
        "maxSelect": 1,
        "name": "station",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "kitchen",
          "bar",
          "both"
        ]
      }
    ],
    "id": "pbc_2456927940",
    "indexes": [],
    "listRule": "",
    "name": "order_items",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940");

  return app.delete(collection);
})
