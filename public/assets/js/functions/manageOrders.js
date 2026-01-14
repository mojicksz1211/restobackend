// ============================================
// ORDERS MANAGEMENT SCRIPT
// ============================================
// File: public/assets/js/functions/manageOrders.js
// Description: Loads orders data, handles modals for order operations
// ============================================

const orderTypeLabels = {
	DINE_IN: 'Dine In',
	TAKE_OUT: 'Take Out',
	DELIVERY: 'Delivery'
};

const orderStatusLabels = {
	1: { text: 'Open', className: 'bg-success' },
	2: { text: 'In Progress', className: 'bg-warning' },
	3: { text: 'Served', className: 'bg-info' },
	4: { text: 'Closed', className: 'bg-primary' },
	5: { text: 'Cancelled', className: 'bg-danger' }
};

let ordersDataTable;
let tablesList = [];
let menusList = [];
let newOrderItems = [];
let editOrderItems = [];
let additionalOrderItems = [];

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#ordersTable')) {
		$('#ordersTable').DataTable().destroy();
	}

	ordersDataTable = $('#ordersTable').DataTable({
		order: [[9, 'desc']],
		columnDefs: [
			{ targets: [3, 9, 11], className: 'text-center' },
			{ targets: 11, orderable: false }
		],
		pageLength: 10
	});

	loadOrders();
	loadTables();
	loadMenus();
});

$(document).on('input', '.order-total-field', function () {
	const prefix = $(this).data('prefix');
	if (prefix) {
		recalculateGrandTotal(prefix);
	}
});

$('#new_order_form').submit(function (event) {
	event.preventDefault();
	const payload = gatherOrderPayload('new', true);
	$.ajax({
		url: '/orders',
		method: 'POST',
		contentType: 'application/json',
		data: JSON.stringify(payload),
		success() {
			$('#modal-new_order').modal('hide');
			Swal.fire({ icon: 'success', title: 'Success', text: 'Order created successfully' });
			loadOrders();
			$('#new_order_form')[0].reset();
			newOrderItems = [];
			renderOrderItems('new');
			recalculateGrandTotal('new');
		},
		error(xhr) {
			console.error('Error creating order:', xhr.responseText);
			Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create order' });
		}
	});
});

$('#edit_order_form').submit(function (event) {
	event.preventDefault();
	const id = $('#edit_order_id').val();
	const payload = gatherOrderPayload('edit', false);
	$.ajax({
		url: `/orders/${id}`,
		method: 'PUT',
		contentType: 'application/json',
		data: JSON.stringify(payload),
		success() {
			$('#modal-edit_order').modal('hide');
			Swal.fire({ icon: 'success', title: 'Updated', text: 'Order updated successfully' });
			loadOrders();
		},
		error(xhr) {
			console.error('Error updating order:', xhr.responseText);
			Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update order' });
		}
	});
});

function loadOrders() {
	$.ajax({
		url: '/orders/data',
		method: 'GET',
		dataType: 'json',
		success(data) {
			ordersDataTable.clear();
			data.forEach(function (row) {
				ordersDataTable.row.add([
					row.ORDER_NO || 'N/A',
					row.TABLE_NUMBER ? `#${row.TABLE_NUMBER}` : 'Unassigned',
					formatOrderType(row.ORDER_TYPE),
					formatOrderStatus(row.STATUS),
					formatCurrency(row.SUBTOTAL),
					formatCurrency(row.TAX_AMOUNT),
					formatCurrency(row.SERVICE_CHARGE),
					formatCurrency(row.DISCOUNT_AMOUNT),
					formatCurrency(row.GRAND_TOTAL),
					formatDate(row.ENCODED_DT),
					row.ENCODED_BY || '-',
					renderActionButtons(row)
				]);
			});

			ordersDataTable.draw();
		},
		error(xhr, status, error) {
			console.error('Failed to load orders:', error);
			Swal.fire({
				icon: 'error',
				title: 'Error!',
				text: 'Unable to load orders. Try refreshing the page.'
			});
		}
	});
}

function loadTables() {
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		success(data) {
			tablesList = data;
		},
		error(xhr, status, error) {
			console.error('Failed to load tables:', error);
		}
	});
}

function loadMenus() {
	$.ajax({
		url: '/menus',
		method: 'GET',
		dataType: 'json',
		success(data) {
			menusList = data;
			populateMenuSelect('#new_order_menu_id');
			populateMenuSelect('#edit_order_menu_id');
		},
		error(xhr, status, error) {
			console.error('Failed to load menus:', error);
		}
	});
}

function populateTableSelect(selector, currentTableId = null) {
	const select = $(selector);
	if (!select.length) {
		return;
	}

	select.empty();
	select.append('<option value="">Select table</option>');
	tablesList.forEach(table => {
		// Show table if AVAILABLE (1) or if it's the table currently assigned to the order
		if (parseInt(table.STATUS) === 1 || table.IDNo == currentTableId) {
			const display = table.TABLE_NUMBER ? `Table ${table.TABLE_NUMBER}` : `Table #${table.IDNo}`;
			const selected = table.IDNo == currentTableId ? 'selected' : '';
			select.append(`<option value="${table.IDNo}" ${selected}>${display}</option>`);
		}
	});
}

function populateMenuSelect(selector) {
	const select = $(selector);
	if (!select.length) {
		return;
	}

	select.empty();
	select.append('<option value="">Select menu item</option>');
	menusList.forEach(menu => {
		select.append(`<option value="${menu.IDNo}" data-price="${menu.MENU_PRICE || 0}">${menu.MENU_NAME} (${formatCurrency(menu.MENU_PRICE)})</option>`);
	});
}

function gatherOrderPayload(prefix, includeOrderNo) {
	const payload = {
		TABLE_ID: $(`#${prefix}_order_table_id`).val() || null,
		ORDER_TYPE: $(`#${prefix}_order_type`).val(),
		STATUS: parseInt($(`#${prefix}_order_status`).val()) || 1,
		SUBTOTAL: parseFloat($(`#${prefix}_order_subtotal`).val()) || 0,
		TAX_AMOUNT: parseFloat($(`#${prefix}_order_tax`).val()) || 0,
		SERVICE_CHARGE: parseFloat($(`#${prefix}_order_service`).val()) || 0,
		DISCOUNT_AMOUNT: parseFloat($(`#${prefix}_order_discount`).val()) || 0,
		GRAND_TOTAL: parseFloat($(`#${prefix}_order_grand_total`).val()) || 0,
		ORDER_ITEMS: getOrderItems(prefix)
	};

	if (includeOrderNo) {
		payload.ORDER_NO = $(`#${prefix}_order_no`).val();
	}

	return payload;
}

function getOrderItems(prefix) {
	if (prefix === 'new') return newOrderItems;
	if (prefix === 'edit') return editOrderItems;
	if (prefix === 'additional') return additionalOrderItems;
	return [];
}

function recalculateGrandTotal(prefix) {
	const items = getOrderItems(prefix) || [];
	const itemsTotal = Array.isArray(items)
		? items.reduce((sum, item) => sum + (parseFloat(item.line_total) || 0), 0)
		: 0;
	
	if (prefix === 'additional') {
		$(`#additional_order_items_total_display`).text(itemsTotal.toFixed(2));
		return;
	}

	$(`#${prefix}_order_subtotal`).val(itemsTotal.toFixed(2));
	const subtotal = parseFloat($(`#${prefix}_order_subtotal`).val()) || 0;
	const tax = parseFloat($(`#${prefix}_order_tax`).val()) || 0;
	const service = parseFloat($(`#${prefix}_order_service`).val()) || 0;
	const discount = parseFloat($(`#${prefix}_order_discount`).val()) || 0;
	const total = subtotal + tax + service - discount;
	$(`#${prefix}_order_grand_total`).val(total.toFixed(2));
}

function addOrderItem(prefix) {
	const menuSelect = $(`#${prefix}_order_menu_id`);
	const menuId = menuSelect.val();
	if (!menuId) {
		Swal.fire({ icon: 'warning', title: 'Validation', text: 'Select a menu item first.' });
		return;
	}

	const qtyInput = $(`#${prefix}_order_menu_qty`);
	const qty = parseInt(qtyInput.val()) || 1;
	if (qty < 1) {
		Swal.fire({ icon: 'warning', title: 'Validation', text: 'Quantity must be at least 1.' });
		return;
	}

	const option = menuSelect.find(`option[value="${menuId}"]`);
	const unitPrice = parseFloat(option.data('price')) || 0;
	const menuName = option.text().replace(/\s\([^)]+\)$/, '');
	const lineTotal = parseFloat((unitPrice * qty).toFixed(2));

	const targetArray = getOrderItems(prefix);
	targetArray.push({
		menu_id: parseInt(menuId),
		menu_name: menuName,
		qty,
		unit_price: unitPrice,
		line_total: lineTotal,
		status: 1
	});

	qtyInput.val(1);
	menuSelect.val('');
	$(`#${prefix}_order_menu_price`).val('');
	renderOrderItems(prefix);
	recalculateGrandTotal(prefix);
}

function renderOrderItems(prefix) {
	const data = getOrderItems(prefix);
	const tbody = $(`#${prefix}_order_items_table tbody`);
	tbody.empty();
	if (!data.length) {
		tbody.append('<tr><td colspan="5" class="text-center">No items added yet.</td></tr>');
		return;
	}

	data.forEach((item, index) => {
		tbody.append(`
			<tr>
				<td>${item.menu_name}</td>
				<td>${item.qty}</td>
				<td>${formatCurrency(item.unit_price)}</td>
				<td>${formatCurrency(item.line_total)}</td>
				<td>
					<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOrderItem('${prefix}', ${index})">
						<i class="fa fa-trash"></i>
					</button>
				</td>
			</tr>
		`);
	});
}

function removeOrderItem(prefix, index) {
	const array = getOrderItems(prefix);
	array.splice(index, 1);
	renderOrderItems(prefix);
	recalculateGrandTotal(prefix);
}

function renderActionButtons(order) {
	return `
		<div class="btn-group" role="group">
			<button type="button" class="btn btn-sm btn-info" onclick="openOrderItemsModal(${order.IDNo})" title="View Items">
				<i class="fa fa-list"></i>
			</button>
			<button type="button" class="btn btn-sm btn-success" onclick="openAdditionalOrderModal(${order.IDNo}, '${order.ORDER_NO}')" title="Additional Order">
				<i class="fa fa-plus-circle"></i>
			</button>
			<button type="button" class="btn btn-sm btn-outline-secondary" onclick="openEditOrderModal(${order.IDNo})" title="Edit Order">
				<i class="fa fa-pencil-alt"></i>
			</button>
		</div>
	`;
}

function openNewOrderModal() {
	$('#new_order_form')[0].reset();
	newOrderItems = [];
	renderOrderItems('new');
	populateMenuSelect('#new_order_menu_id');
	
	// Reload tables to get latest status before showing dropdown
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		success(data) {
			tablesList = data;
			populateTableSelect('#new_order_table_id');
			recalculateGrandTotal('new');
			$('#modal-new_order').modal('show');
		}
	});
}

function openEditOrderModal(orderId) {
	$('#edit_order_menu_id').val('');
	$('#edit_order_menu_qty').val(1);
	$('#edit_order_menu_price').val('');

	// Reload tables to get latest status
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		success(data) {
			tablesList = data;
			
			// Then load order details
			$.ajax({
				url: `/orders/${orderId}`,
				method: 'GET',
				success(order) {
					$('#edit_order_id').val(orderId);
					$('#edit_order_no').val(order.ORDER_NO);
					populateTableSelect('#edit_order_table_id', order.TABLE_ID);
					$('#edit_order_type').val(order.ORDER_TYPE || 'DINE_IN');
					$('#edit_order_status').val(order.STATUS || 1);
					$('#edit_order_subtotal').val(order.SUBTOTAL || 0);
					$('#edit_order_tax').val(order.TAX_AMOUNT || 0);
					$('#edit_order_service').val(order.SERVICE_CHARGE || 0);
					$('#edit_order_discount').val(order.DISCOUNT_AMOUNT || 0);
					$('#edit_order_grand_total').val(order.GRAND_TOTAL || 0);
					$.ajax({
						url: `/orders/${orderId}/items`,
						method: 'GET',
						success(items) {
							editOrderItems = items.map(item => ({
								menu_id: item.MENU_ID,
								menu_name: item.MENU_NAME || `Menu #${item.MENU_ID}`,
								qty: parseInt(item.QTY) || 0,
								unit_price: parseFloat(item.UNIT_PRICE) || 0,
								line_total: parseFloat(item.LINE_TOTAL) || 0
							}));
							renderOrderItems('edit');
							recalculateGrandTotal('edit');
							$('#modal-edit_order').modal('show');
						},
						error(err) {
							console.error('Failed to load items for edit:', err.responseText);
							editOrderItems = [];
							renderOrderItems('edit');
							recalculateGrandTotal('edit');
							$('#modal-edit_order').modal('show');
						}
					});
				},
				error(xhr) {
					console.error('Failed to load order for edit:', xhr.responseText);
					Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to load order for editing' });
				}
			});
		}
	});
}

function openAdditionalOrderModal(orderId, orderNo) {
	$('#additional_order_id').val(orderId);
	$('#additional_order_no_display').text(orderNo);
	$('#additional_order_menu_id').val('');
	$('#additional_order_menu_qty').val(1);
	$('#additional_order_menu_price').val('');
	populateMenuSelect('#additional_order_menu_id');

	$.ajax({
		url: `/orders/${orderId}/items`,
		method: 'GET',
		success(items) {
			additionalOrderItems = items.map(item => ({
				menu_id: item.MENU_ID,
				menu_name: item.MENU_NAME || `Menu #${item.MENU_ID}`,
				qty: parseInt(item.QTY) || 0,
				unit_price: parseFloat(item.UNIT_PRICE) || 0,
				line_total: parseFloat(item.LINE_TOTAL) || 0,
				status: item.STATUS || 1
			}));
			renderOrderItems('additional');
			recalculateGrandTotal('additional');
			$('#modal-additional_order').modal('show');
		},
		error(err) {
			console.error('Failed to load items for additional order:', err.responseText);
			additionalOrderItems = [];
			renderOrderItems('additional');
			recalculateGrandTotal('additional');
			$('#modal-additional_order').modal('show');
		}
	});
}

$('#additional_order_form').submit(function (event) {
	event.preventDefault();
	const id = $('#additional_order_id').val();
	const total = parseFloat($('#additional_order_items_total_display').text()) || 0;
	
	// First update the order totals based on the new items
	$.ajax({
		url: `/orders/${id}`,
		method: 'GET',
		success(order) {
			// Merge current totals with new items total? No, additionalOrderItems ALREADY contains all items.
			// So we just need to update the order with the new GRAND_TOTAL and items.
			const payload = {
				TABLE_ID: order.TABLE_ID,
				ORDER_TYPE: order.ORDER_TYPE,
				STATUS: order.STATUS,
				SUBTOTAL: total,
				TAX_AMOUNT: parseFloat(order.TAX_AMOUNT) || 0,
				SERVICE_CHARGE: parseFloat(order.SERVICE_CHARGE) || 0,
				DISCOUNT_AMOUNT: parseFloat(order.DISCOUNT_AMOUNT) || 0,
				GRAND_TOTAL: total + (parseFloat(order.TAX_AMOUNT) || 0) + (parseFloat(order.SERVICE_CHARGE) || 0) - (parseFloat(order.DISCOUNT_AMOUNT) || 0),
				ORDER_ITEMS: additionalOrderItems
			};

			$.ajax({
				url: `/orders/${id}`,
				method: 'PUT',
				contentType: 'application/json',
				data: JSON.stringify(payload),
				success() {
					$('#modal-additional_order').modal('hide');
					Swal.fire({ icon: 'success', title: 'Success', text: 'Additional order saved' });
					loadOrders();
				},
				error(xhr) {
					console.error('Error updating order:', xhr.responseText);
					Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update order' });
				}
			});
		}
	});
});

function orderMenuSelectionChanged(prefix) {
	const select = $(`#${prefix}_order_menu_id`);
	const option = select.find('option:selected');
	const price = parseFloat(option.data('price')) || 0;
	$(`#${prefix}_order_menu_price`).val(price.toFixed(2));
}

function openOrderItemsModal(orderId) {
	$('#orderItemsTable tbody').empty();
	$('#modal-order_items').modal('show');
	$.ajax({
		url: `/orders/${orderId}/items`,
		method: 'GET',
		success(items) {
			const tbody = $('#orderItemsTable tbody');
			if (!items.length) {
				tbody.append('<tr><td colspan="7" class="text-center">No order items recorded yet.</td></tr>');
				return;
			}
			items.forEach(item => {
				tbody.append(`
					<tr>
						<td>${item.MENU_NAME || 'Menu #' + item.MENU_ID}</td>
						<td>${item.QTY}</td>
						<td>${formatCurrency(item.UNIT_PRICE)}</td>
						<td>${formatCurrency(item.LINE_TOTAL)}</td>
						<td>${formatItemStatus(item.STATUS)}</td>
						<td>${item.REMARKS || '-'}</td>
						<td>
							<div class="dropdown">
								<button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="viewport" data-bs-popper-config='{"strategy":"fixed"}'>
									Update Status
								</button>
								<ul class="dropdown-menu dropdown-menu-end">
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 1, ${orderId})">Pending</a></li>
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 2, ${orderId})">Preparing</a></li>
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 3, ${orderId})">Ready</a></li>
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 4, ${orderId})">Served</a></li>
								</ul>
							</div>
						</td>
					</tr>
				`);
			});
		},
		error(xhr) {
			console.error('Failed to load order items:', xhr.responseText);
			$('#orderItemsTable tbody').append('<tr><td colspan="7" class="text-center text-danger">Unable to load items.</td></tr>');
		}
	});
}

function updateItemStatus(itemId, status, orderId) {
	$.ajax({
		url: `/order_items/${itemId}/status`,
		method: 'PUT',
		data: { status: status },
		success() {
			openOrderItemsModal(orderId);
		},
		error(xhr) {
			console.error('Failed to update item status:', xhr.responseText);
			Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status' });
		}
	});
}

function formatItemStatus(status) {
	switch (parseInt(status)) {
		case 1:
			return '<span class="badge bg-secondary">Pending</span>';
		case 2:
			return '<span class="badge bg-info">Preparing</span>';
		case 3:
			return '<span class="badge bg-primary">Ready</span>';
		case 4:
			return '<span class="badge bg-success">Served</span>';
		default:
			return '<span class="badge bg-secondary">Unknown</span>';
	}
}

function formatOrderType(code) {
	return orderTypeLabels[code] || 'Unknown';
}

function formatOrderStatus(status) {
	const statusInfo = orderStatusLabels[parseInt(status)];
	if (!statusInfo) {
		return '<span class="badge bg-secondary">Unknown</span>';
	}
	return `<span class="badge ${statusInfo.className}">${statusInfo.text}</span>`;
}

function formatCurrency(value) {
	const mounted = parseFloat(value);
	if (Number.isNaN(mounted)) {
		return '0.00';
	}
	return mounted.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

function formatDate(value) {
	if (!value) {
		return 'N/A';
	}

	const date = new Date(value);
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

$('#new_order_menu_id').on('change', function () {
	orderMenuSelectionChanged('new');
});

$('#edit_order_menu_id').on('change', function () {
	orderMenuSelectionChanged('edit');
});

$('#additional_order_menu_id').on('change', function () {
	orderMenuSelectionChanged('additional');
});
