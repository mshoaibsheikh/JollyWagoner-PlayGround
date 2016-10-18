
angular.module("directive.matrix", [])
.directive('ngMatrix', ['$http', '$filter', function($http, $filter) {
	return {
		transclude: false,
		templateUrl: 'ngMatrix-template.html',
		restrict: 'EMAC',
		scope: {
			collapsedrowCaption: '@collapsedrowCaption',
			collapsedrowheaderCss: '@collapsedrowheaderCss',
			collapsedrowItemCss: '@collapsedrowItemCss',
			collapsedcontentCss: '@collapsedcontentCss',
			collapsedItemData: '=?',
			cssClass: '@cssClass',
			detailsrowcolumnHeader: '@detailsrowcolumnHeader',
			enableExpandCollapse: '@enableExpandCollapse',
			evenrowCss: '@evenrowCss',
			gridCss: '@gridCss',
			gridHeight: '@gridHeight',
			gridheaderCss: '@gridheaderCss',
			gridfooterCss: '@gridfooterCss',
			gridHeaders: '@gridHeaders',
			gridsourceUri: '@gridsourceUri',
			itemTemplateUrl: '@itemTemplateUrl',
			selectedRowIdx: '=?selectedRowIdx',
			showcheckboxColumn: '@showcheckboxColumn',
			showDeleteButtonColumn: '@showDeleteButtonColumn',
			showViewDetailColumn: '@showViewDetailColumn',
			showFilter: '@showFilter',
			showFooter: '@showFooter',
			//searchbarCss: '@searchbarCss',
			noDataMessage: '@noDataMessage',
			oddrowCss: '@oddrowCss',
			onDeleteRecord: '&',
			publicControl: '=',
			viewDetailImageUrl: '@viewDetailImageUrl',
			viewDetailText: '@viewDetailText',
			viewRecordDetailMethod: '&'
		},
		controller: function($scope, $http, $attrs) {


		},
		link: function(scope, elem, attrs) {

			scope.data = [];
			scope.headers = [];
			scope.originalData = [];
			scope.noDataMessageDisplay = false;
			scope.selectedRowIdx = -1;
			scope.gridHeaderRow = eval(scope.gridHeaders);
			scope.gridMasterIdentifier = "grid-row-master-";  // Used for generating not-collapsed(Visible) row Ids.
			scope.gridDetailIdentifier = "grid-row-detail-";  // Used for generating row Ids of collapsed rows.

			scope.directiveControl = scope.publicControl || {};
			//scope.directiveControl.contentLoading = false;

			scope.directiveControl.invertRowSelection = function(checked) {
				for (index in scope.data) scope.data[index].selected = checked;
			};

			scope.directiveControl.getSelectedRows = function() {
				var selectedrows = [];

				for (index in scope.data)
					if (scope.data[index].selected)
						//selectedrows.push(scope.data[index].dataItem);
						selectedrows.push(scope.data[index]);

				return selectedrows;
			}

			scope.directiveControl.getSelectedRowData = function() {
				return scope.data[scope.selectedRowIdx];
			};

			scope.directiveControl.loadData = function(dataSource) {

				scope.data.length = scope.headers.length = 0;

				if (dataSource.length == 0 || dataSource == null || typeof (dataSource) === 'string' || typeof (dataSource) === undefined) {
					scope.noDataMessageDisplay = true;
					return;
				} else {
					scope.noDataMessageDisplay = false;
				}

				// Build headers.
				for (header in dataSource[0]) {
					if (findHeader(scope.gridHeaderRow, header) && // Make sure if we want to show this header.
                        header != scope.detailsrowcolumnHeader) {
						var column = {};
						column.name = header;
						scope.headers.push(column);
					}
				}
				// Build rows.
				for (index in dataSource) {
					//var rowData = { selected: false, dataItem: dataSource[index] };
					var rowData = dataSource[index];
					rowData.selected = false;
					scope.data.push(rowData);
				}

				// Saving in extra array for later use during grid operations.
				scope.originalData = scope.data;
			}

			scope.onItemChecked = function(eventArgs, dataIndex, rowData) {
				eventArgs.cancelBubble = true;
			};

			scope.shortifyText = function(length) {
				var style = {};
				if (length > 80)
					style = { textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '200px' };
				else
					style = { textOverflow: 'initial' };

				return style;
			};

			scope.getCollapsedPaneWidth = function() {
				if (eval(scope.showcheckboxColumn) && eval(scope.showDeleteButtonColumn)) return scope.headers.length + 2;
				else if (eval(scope.showcheckboxColumn) || eval(scope.showDeleteButtonColumn)) return scope.headers.length + 1;
				else return scope.headers.length;
			};

			var findHeader = function(headersArr, fieldName) {
				var found = false;
				for (index in headersArr)
					if (headersArr[index].field == fieldName) {
						found = true;
						break;
					}
				return found;
			};

			scope.findDisplayName = function(fieldName) {
				var dN = '';
				for (index in scope.gridHeaderRow)
					if (scope.gridHeaderRow[index].field == fieldName) {
						dN = scope.gridHeaderRow[index].displayName;
						break;
					}
				return dN;
			};

			scope.findColumnWidth = function(colName) {
				var width = {};

				for (index in scope.gridHeaderRow) {
					if (scope.gridHeaderRow[index].field == colName) {
						width = scope.gridHeaderRow[index].width;
					}
				}
				return width;
			};

			var clearHighlights = function(rowCollection) {

				// Clear highlighting from all rows.
				for (var i = 0; i < rowCollection.length; i += 2) {
					// Get current row.
					var currentRow = rowCollection[i];
					// Remove highlighting from this row.
					if (currentRow.className.indexOf('selected-row') > -1) {
						currentRow.className = currentRow.className.replace('selected-row', '').trim();
						break; // Assuming only one row will be highlighted at a time.
					}
				}
			};

			/// <summary> Controls row highlighting/selection using up/down arrow key.</summary>
			scope.onRowSelect = function(idx, eventArgs) {

				clearHighlights(ev.currentTarget.parentElement.rows);

				// Pressed up.
				if (eventArgs.keyCode == 38 && scope.selectedRowIdx > -1) { scope.selectedRowIdx--; }
				// Pressed down.
				if (eventArgs.keyCode == 40 && scope.selectedRowIdx < scope.data.length) { scope.selectedRowIdx++; }
				// Even number rows are going to be selected everytime.Odd rows are collapsed ones.i.e index*2
				eventArgs.currentTarget.parentElement.rows[scope.selectedRowIdx * 2].className += ' selected-row';
			}

			scope.onRowClick = function(index, eventArgs) {

				scope.collapsedItemData = scope.data[index];

				expandCollapse(index, eventArgs);
			};

			/// <summary> Used for expanding and collapsing rows functionality.</summary>
			var expandCollapse = function(idx, ev) {

				clearHighlights(ev.currentTarget.parentElement.rows);

				scope.selectedRowIdx = idx;

				// Add highlighting to current row.
				if (ev.currentTarget.className.indexOf('selected-row') < 0)
					ev.currentTarget.className += ' selected-row';

				if (eval(scope.enableExpandCollapse)) {

					var detailsRow = ev.currentTarget.parentElement.rows[(idx * 2) + 1];
					detailsRow.style.display = detailsRow.style.display == 'none' ? '' : 'none';
				}
			};

			/// <summary> Used for ordering data loaded in the grid.</summary>
			scope.orderTableBy = function(header) {

				if (scope.orderHeader == header && scope.orderDirection == false) {
					scope.orderHeader = null; // Clear sort.
					scope.data = scope.originalData;
				}
				else if (scope.orderHeader == header) {
					scope.orderDirection = false; // Desc.
					scope.data = $filter('orderBy')(scope.originalData, scope.orderHeader, scope.orderDirection);
				} else { // First time only when both orderHeader and orderDirection are undefined.
					scope.orderHeader = header;
					scope.orderDirection = true; // Asc.
					scope.data = $filter('orderBy')(scope.originalData, scope.orderHeader, scope.orderDirection);
				}
			};

			/// <summary>Alternates css class between even/odd rows.</summary>
			scope.alternateRowColors = function(idx) {
				return idx % 2 === 0 ? scope.oddrowCss : scope.evenrowCss;
			}

			/// <summary>Fires when delete row button is clicked on grid row.</summary>
			scope.deleteRecord = function(eventArgs, dataToBeDeleted) {
				if (scope.onDeleteRecord)
					scope.onDeleteRecord({ rowData: dataToBeDeleted });
				eventArgs.cancelBubble = true;
			};

			scope.onViewDetailsClick = function(eventArgs, dataRow) {
				if (scope.viewRecordDetailMethod)
					scope.viewRecordDetailMethod({ rowData: dataRow });
				eventArgs.cancelBubble = true;
			};

			/// <summary> Loads data in the grid using gridsourceUri property or gridSource property.</summary>
			var loadGrid = function() {

				if (scope.gridsourceUri) {
					scope.directiveControl.contentLoading = true;
					// Async call to retrieve data.
					$http({ method: 'GET', url: scope.gridsourceUri }).
                        success(function(data, status, headers, config) {
                        	scope.directiveControl.contentLoading = false;
                        	// Build headers.
                        	for (header in data[0]) {
                        		if (findHeader(scope.gridHeaderRow, header) && // Make sure if we want to show this header.
                                    header != scope.detailsrowcolumnHeader) { // Skip loading details row header because data from this column will show up in collapsed row.
                        			var column = {};
                        			column.name = header;
                        			scope.headers.push(column);
                        		}
                        	}

                        	// Build rows.
                        	for (index in data) {
                        		//var rowData = { selected: false, dataItem: data[index] };
                        		var rowData = data[index];
                        		rowData.selected = false;
                        		scope.data.push(rowData);
                        	}

                        	// Saving in extra array for later use during grid operations.
                        	scope.originalData = scope.data;

                        }).
                        error(function(data, status, headers, config) {
                        	scope.directiveControl.contentLoading = false;
                        	console.log(scope.data)
                        });
				}
				else {

				}
			};

			// Load the grid.
			loadGrid();
		}
	}
}]).filter('dataFormatter', function() {

	var formatData = function(valueToFormat, columnName) {

		var date = null;

		if (valueToFormat != null && columnName.toUpperCase().indexOf('DATE') > -1) {
			try {
				valueToFormat = valueToFormat.substr(0, valueToFormat.indexOf('T'));
				var d = valueToFormat.split('-');
				date = new Date(d[0], parseInt(d[1]) - 1, d[2], 0, 0, 0, 0);
				return date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
			} catch (e) {
				return valueToFormat;
			}

		} else if (valueToFormat != null && columnName.toUpperCase().indexOf('TIME') > -1) {
			try {
				valueToFormat = valueToFormat.substr(valueToFormat.indexOf('T') + 1);
				var d = valueToFormat.split(':');
				date = new Date(0, 0, 0, d[0], d[1], d[2]);
				return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
			} catch (e) {
				return valueToFormat;
			}
		} else {
			return valueToFormat;
		}
	};

	return formatData;
});