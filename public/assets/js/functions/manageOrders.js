// ============================================
// ORDERS MANAGEMENT SCRIPT
// ============================================
// File: public/assets/js/functions/manageOrders.js
// Description: Loads orders data, handles modals for order operations
// ============================================

// Use translations from server if available, otherwise fallback to English
const orderTypeLabels = window.orderTranslations?.orderTypes || {
	DINE_IN: 'Dine In',
	TAKE_OUT: 'Take Out',
	DELIVERY: 'Delivery'
};

const orderStatusLabels = window.orderTranslations?.orderStatuses ? {
	3: { text: window.orderTranslations.orderStatuses[3], className: 'bg-warning' },
	2: { text: window.orderTranslations.orderStatuses[2], className: 'bg-info' },
	1: { text: window.orderTranslations.orderStatuses[1], className: 'bg-success' },
	'-1': { text: window.orderTranslations.orderStatuses['-1'], className: 'bg-danger' }
} : {
	3: { text: 'Pending', className: 'bg-warning' },
	2: { text: 'Confirmed', className: 'bg-info' },
	1: { text: 'Settled', className: 'bg-success' },
	'-1': { text: 'Cancelled', className: 'bg-danger' }
};

function getOrderContext() {
	const el = document.getElementById('orderContextData');
	if (!el) {
		return { permissions: 0, branchId: null };
	}
	const permissions = parseInt(el.getAttribute('data-permissions') || '0');
	const branchId = el.getAttribute('data-branch-id') || null;
	return { permissions, branchId };
}

function adminNeedsBranchSelection() {
	const ctx = getOrderContext();
	return ctx.permissions === 1 && !ctx.branchId;
}

let ordersDataTable;
let tablesList = [];
let menusList = [];
let newOrderItems = [];
let editOrderItems = [];
let additionalOrderItems = [];
let showBranchColumn = false;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#ordersTable')) {
		$('#ordersTable').DataTable().destroy();
	}

	showBranchColumn = adminNeedsBranchSelection();

	// Load pagination translations from data attributes
	var $paginationEl = $('#ordersPaginationTranslations');
	var paginationTrans = {};
	if ($paginationEl.length) {
		paginationTrans = {
			showing: $paginationEl.data('pagination-showing') || 'Showing',
			to: $paginationEl.data('pagination-to') || 'to',
			of: $paginationEl.data('pagination-of') || 'of',
			entries: $paginationEl.data('pagination-entries') || 'entries',
			previous: $paginationEl.data('pagination-previous') || 'Previous',
			next: $paginationEl.data('pagination-next') || 'Next',
			search: $paginationEl.data('pagination-search') || 'Search',
			search_placeholder: $paginationEl.data('pagination-search-placeholder') || 'Search...'
		};
	} else {
		// Fallback if data attributes are not available
		paginationTrans = {
			showing: 'Showing',
			to: 'to',
			of: 'of',
			entries: 'entries',
			previous: 'Previous',
			next: 'Next',
			search: 'Search',
			search_placeholder: 'Search...'
		};
	}

	const showingText = paginationTrans.showing;
	const toText = paginationTrans.to;
	const ofText = paginationTrans.of;
	const entriesText = paginationTrans.entries;
	const searchText = paginationTrans.search;

	const statusIdx = showBranchColumn ? 4 : 3;
	const dateIdx = showBranchColumn ? 10 : 9;
	const actionsIdx = showBranchColumn ? 12 : 11;

	ordersDataTable = $('#ordersTable').DataTable({
		order: [[dateIdx, 'desc']],
		columnDefs: [
			{ targets: [statusIdx, dateIdx, actionsIdx], className: 'text-center' },
			{ targets: actionsIdx, orderable: false }
		],
		pageLength: 10,
		language: {
			lengthMenu: showingText + " _MENU_ " + entriesText,
			info: showingText + " _START_ " + toText + " _END_ " + ofText + " _TOTAL_ " + entriesText,
			infoEmpty: showingText + " 0 " + toText + " 0 " + ofText + " 0 " + entriesText,
			infoFiltered: "(" + searchText + " " + ofText + " _MAX_ " + entriesText + ")",
			search: searchText + ":",
			searchPlaceholder: paginationTrans.search_placeholder,
			paginate: {
				previous: paginationTrans.previous,
				next: paginationTrans.next
			}
		}
	});

	loadOrders();
	loadTables();
	loadMenus();

	// Handle order type change for new order (use event delegation)
	$(document).on('change', '#new_order_type', function() {
		toggleTableField('new', $(this).val());
	});

	// Handle order type change for edit order
	$(document).on('change', '#edit_order_type', function() {
		toggleTableField('edit', $(this).val());
	});
});

$(document).on('input', '.order-total-field', function () {
	const prefix = $(this).data('prefix');
	if (prefix) {
		recalculateGrandTotal(prefix);
	}
});

$('#new_order_form').submit(function (event) {
	event.preventDefault();
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before creating an order.'
		});
		return;
	}
	const payload = gatherOrderPayload('new', true);

	if (!payload.ORDER_ITEMS || payload.ORDER_ITEMS.length === 0) {
		Swal.fire({ icon: 'error', title: 'Validation', text: 'Please add at least one menu item to the order.' });
		return;
	}

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
				// Show table number only for DINE_IN orders, otherwise show N/A
				const n_a = window.orderTranslations?.n_a || 'N/A';
				const branchLabel = row.BRANCH_NAME || row.BRANCH_LABEL || n_a;
				const tableDisplay = (row.ORDER_TYPE === 'DINE_IN' && row.TABLE_NUMBER) 
					? `#${row.TABLE_NUMBER}` 
					: n_a;
				const encodedByLabel = row.ENCODED_BY_NAME || row.ENCODED_BY || '-';

				const baseRow = [
					row.ORDER_NO || n_a,
					showBranchColumn ? branchLabel : null,
					tableDisplay,
					formatOrderType(row.ORDER_TYPE),
					formatOrderStatus(row.STATUS),
					formatCurrency(row.SUBTOTAL),
					formatCurrency(row.TAX_AMOUNT),
					formatCurrency(row.SERVICE_CHARGE),
					formatCurrency(row.DISCOUNT_AMOUNT),
					formatCurrency(row.GRAND_TOTAL),
					formatDateColumn(row.ENCODED_DT),
					encodedByLabel,
					renderActionButtons(row)
				];

				const rowData = showBranchColumn ? baseRow : baseRow.filter((_, idx) => idx !== 1);
				ordersDataTable.row.add(rowData);
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
	const selectTableText = window.orderTranslations?.select_table || 'Select table';
	select.append(`<option value="">${selectTableText}</option>`);
	tablesList.forEach(table => {
		// Show table if AVAILABLE (1) or if it's the table currently assigned to the order
		if (parseInt(table.STATUS) === 1 || table.IDNo == currentTableId) {
			const display = table.TABLE_NUMBER ? `Table ${table.TABLE_NUMBER}` : `Table #${table.IDNo}`;
			const selected = table.IDNo == currentTableId ? 'selected' : '';
			select.append(`<option value="${table.IDNo}" ${selected}>${display}</option>`);
		}
	});
}

function toggleTableField(prefix, orderType) {
	const tableSelect = $(`#${prefix}_order_table_id`);
	const tableField = tableSelect.closest('.col-md-4');
	
	if (orderType === 'TAKE_OUT' || orderType === 'DELIVERY') {
		// Hide table field and set to null/unassigned
		tableField.css('display', 'none');
		tableSelect.val('').prop('disabled', true);
	} else {
		// Show table field for DINE_IN
		tableField.css('display', 'block');
		tableSelect.prop('disabled', false);
	}
}

function populateMenuSelect(selector) {
	const select = $(selector);
	if (!select.length) {
		return;
	}

	select.empty();
	const selectMenuItemText = window.orderTranslations?.select_menu_item || 'Select menu item';
	select.append(`<option value="">${selectMenuItemText}</option>`);
	menusList.forEach(menu => {
		select.append(`<option value="${menu.IDNo}" data-price="${menu.MENU_PRICE || 0}">${menu.MENU_NAME} (${formatCurrency(menu.MENU_PRICE)})</option>`);
	});
}

function gatherOrderPayload(prefix, includeOrderNo) {
	const orderType = $(`#${prefix}_order_type`).val();
	const tableId = $(`#${prefix}_order_table_id`).val();
	
	// For Take Out or Delivery, set TABLE_ID to null
	const finalTableId = (orderType === 'TAKE_OUT' || orderType === 'DELIVERY') ? null : (tableId || null);
	
	const payload = {
		TABLE_ID: finalTableId,
		ORDER_TYPE: orderType,
		STATUS: parseInt($(`#${prefix}_order_status`).val()) || 3,
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
		status: 3  // Default: 3=PENDING
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
		// For additional order items with status = 1 (READY), show "Served" badge instead of delete button
		let actionCell = '';
		if (prefix === 'additional' && item.status === 1) {
			actionCell = '<span class="badge bg-success">Served</span>';
		} else {
			actionCell = `
				<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOrderItem('${prefix}', ${index})">
					<i class="fa fa-trash"></i>
				</button>
			`;
		}
		
		// Apply alignment classes to match table headers
		const qtyAlign = prefix === 'additional' ? 'text-center' : '';
		const priceAlign = prefix === 'additional' ? 'text-end' : '';
		const actionAlign = prefix === 'additional' ? 'text-center' : '';
		
		tbody.append(`
			<tr>
				<td>${item.menu_name}</td>
				<td class="${qtyAlign}">${item.qty}</td>
				<td class="${priceAlign}">${formatCurrency(item.unit_price)}</td>
				<td class="${priceAlign}">${formatCurrency(item.line_total)}</td>
				<td class="${actionAlign}">${actionCell}</td>
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
	// STATUS is a number from database (tinyint)
	const status = Number(order.STATUS);
	
	let buttons = '';
	
		if (status === 3) {
		// PENDING: Confirmation button stays green even if theme changes
		buttons = `
			<button type="button" class="btn btn-sm btn-success btn-confirmation" onclick="confirmOrder(${order.IDNo})" title="Confirm Order">
				<i class="fa fa-check"></i> Confirmation
			</button>
			<button type="button" class="btn btn-sm btn-outline-primary" onclick="openEditOrderModal(${order.IDNo})" title="Edit Order">
				<i class="fa fa-pencil-alt"></i>
			</button>
		`;
	} else if (status === 2) {
		// CONFIRMED: Show View Items and Additional Order buttons (theme primary)
		buttons = `
			<button type="button" class="btn btn-sm btn-primary" onclick="openOrderItemsModal(${order.IDNo})" title="View Items">
				<i class="fa fa-list"></i>
			</button>
			<button type="button" class="btn btn-sm btn-outline-primary" onclick="openAdditionalOrderModal(${order.IDNo}, '${order.ORDER_NO}')" title="Additional Order">
				<i class="fa fa-plus-circle"></i>
			</button>
		`;
	} else {
		// Other statuses (1=SETTLED, -1=CANCELLED): Show View Items only
		buttons = `
			<button type="button" class="btn btn-sm btn-primary" onclick="openOrderItemsModal(${order.IDNo})" title="View Items">
				<i class="fa fa-list"></i>
			</button>
		`;
	}
	
	return `<div class="btn-group" role="group">${buttons}</div>`;
}

function openNewOrderModal() {
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before creating an order.'
		});
		return;
	}
	$('#new_order_form')[0].reset();
	newOrderItems = [];
	renderOrderItems('new');
	populateMenuSelect('#new_order_menu_id');
	
	// Set default order type to DINE_IN
	$('#new_order_type').val('DINE_IN');
	
	// Reload tables to get latest status before showing dropdown
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		success(data) {
			tablesList = data;
			populateTableSelect('#new_order_table_id');
			recalculateGrandTotal('new');
			// Show modal first
			$('#modal-new_order').modal('show');
			// Then toggle table field based on current order type (default is DINE_IN)
			setTimeout(function() {
				const currentOrderType = $('#new_order_type').val() || 'DINE_IN';
				toggleTableField('new', currentOrderType);
			}, 150);
		}
	});
}

function openEditOrderModal(orderId) {
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before editing an order.'
		});
		return;
	}
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
					const orderType = order.ORDER_TYPE || 'DINE_IN';
					$('#edit_order_type').val(orderType);
					populateTableSelect('#edit_order_table_id', order.TABLE_ID);
					// Toggle table field based on order type
					toggleTableField('edit', orderType);
					$('#edit_order_status').val(order.STATUS || 3);
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
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before adding to this order.'
		});
		return;
	}
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
				status: item.STATUS || 3  // Default: 3=PENDING
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
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before saving additional items.'
		});
		return;
	}
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
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before viewing order items.'
		});
		return;
	}
	$('#orderItemsTable tbody').empty();
	$('#modal-order_items').modal('show');
	
	// Get order status first to check if it's settled
	$.ajax({
		url: `/orders/${orderId}`,
		method: 'GET',
		success(order) {
			const orderStatus = Number(order.STATUS);
			const isSettled = orderStatus === 1; // 1 = SETTLED
			
			// Load order items
			$.ajax({
				url: `/orders/${orderId}/items`,
				method: 'GET',
				success(items) {
					const tbody = $('#orderItemsTable tbody');
					if (!items.length) {
						tbody.append('<tr><td colspan="8" class="text-center">No order items recorded yet.</td></tr>');
						return;
					}
					items.forEach(item => {
						// Hide action button if order is settled
						const actionButton = isSettled ? '-' : `
							<div class="dropdown">
								<button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="viewport" data-bs-popper-config='{"strategy":"fixed"}'>
									Update Status
								</button>
								<ul class="dropdown-menu dropdown-menu-end">
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 3, ${orderId})">Pending</a></li>
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 2, ${orderId})">Preparing</a></li>
									<li><a class="dropdown-item" href="javascript:void(0)" onclick="updateItemStatus(${item.IDNo}, 1, ${orderId})">Ready</a></li>
								</ul>
							</div>
						`;
						
						// Column order: Menu Item, Qty, Unit Price, Line Total, Status, Remarks, Prepared By, Actions
						tbody.append(`
							<tr>
								<td>${item.MENU_NAME || 'Menu #' + item.MENU_ID}</td>
								<td>${item.QTY}</td>
								<td>${formatCurrency(item.UNIT_PRICE)}</td>
								<td>${formatCurrency(item.LINE_TOTAL)}</td>
								<td>${formatItemStatus(item.STATUS)}</td>
								<td>${item.REMARKS || '-'}</td>
								<td>${item.PREPARED_BY || '-'}</td>
								<td>${actionButton}</td>
							</tr>
						`);
					});
				},
				error(xhr) {
					console.error('Failed to load order items:', xhr.responseText);
					$('#orderItemsTable tbody').append('<tr><td colspan="8" class="text-center text-danger">Unable to load items.</td></tr>');
				}
			});
		},
		error(xhr) {
			console.error('Failed to load order:', xhr.responseText);
			$('#orderItemsTable tbody').append('<tr><td colspan="7" class="text-center text-danger">Unable to load order details.</td></tr>');
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
	// order_items STATUS: 3=PENDING; 2=PREPARING; 1=READY
	const statusNum = Number(status);
	switch (statusNum) {
		case 3:
			return '<span class="badge bg-warning">Pending</span>';
		case 2:
			return '<span class="badge bg-info">Preparing</span>';
		case 1:
			return '<span class="badge bg-success">Ready</span>';
		default:
			return '<span class="badge bg-secondary">Unknown</span>';
	}
}

function formatOrderType(code) {
	return orderTypeLabels[code] || 'Unknown';
}

function formatOrderStatus(status) {
	const statusInt = parseInt(status);
	const statusKey = statusInt === -1 ? '-1' : statusInt.toString();
	const statusInfo = orderStatusLabels[statusKey];
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
		return window.orderTranslations?.n_a || 'N/A';
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

function formatDateColumn(value) {
	const formatted = formatDate(value);
	if (!value) {
		return formatted;
	}

	const date = new Date(value);
	const timestamp = date.getTime();
	if (Number.isNaN(timestamp)) {
		return formatted;
	}

	return `<span data-order="${timestamp}">${formatted}</span>`;
}

function confirmOrder(orderId) {
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before confirming an order.'
		});
		return;
	}
	Swal.fire({
		title: 'Confirm Order',
		text: 'Are you sure you want to confirm this order?',
		icon: 'question',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, confirm it!',
		cancelButtonText: 'Cancel'
	}).then((result) => {
		if (result.isConfirmed) {
			// Get current order data and items first
			$.ajax({
				url: `/orders/${orderId}`,
				method: 'GET',
				success(order) {
					// Get existing order items to preserve them
					$.ajax({
						url: `/orders/${orderId}/items`,
						method: 'GET',
						success(items) {
							// Update order status to 2 (CONFIRMED) with existing items
							const payload = {
								TABLE_ID: order.TABLE_ID,
								ORDER_TYPE: order.ORDER_TYPE,
								STATUS: 2, // CONFIRMED
								SUBTOTAL: parseFloat(order.SUBTOTAL) || 0,
								TAX_AMOUNT: parseFloat(order.TAX_AMOUNT) || 0,
								SERVICE_CHARGE: parseFloat(order.SERVICE_CHARGE) || 0,
								DISCOUNT_AMOUNT: parseFloat(order.DISCOUNT_AMOUNT) || 0,
								GRAND_TOTAL: parseFloat(order.GRAND_TOTAL) || 0,
								ORDER_ITEMS: items.map(item => ({
									menu_id: item.MENU_ID,
									qty: item.QTY,
									unit_price: item.UNIT_PRICE,
									line_total: item.LINE_TOTAL,
									status: item.STATUS || 3
								}))
							};
							
							$.ajax({
								url: `/orders/${orderId}`,
								method: 'PUT',
								contentType: 'application/json',
								data: JSON.stringify(payload),
								success() {
									Swal.fire({
										icon: 'success',
										title: 'Confirmed!',
										text: 'Order has been confirmed successfully.',
										timer: 1500,
										showConfirmButton: false
									});
									loadOrders();
								},
								error(xhr) {
									console.error('Error confirming order:', xhr.responseText);
									Swal.fire({
										icon: 'error',
										title: 'Error',
										text: 'Failed to confirm order. Please try again.'
									});
								}
							});
						},
						error(xhr) {
							console.error('Error fetching order items:', xhr.responseText);
							Swal.fire({
								icon: 'error',
								title: 'Error',
								text: 'Failed to load order items.'
							});
						}
					});
				},
				error(xhr) {
					console.error('Error fetching order:', xhr.responseText);
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: 'Failed to load order details.'
					});
				}
			});
		}
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
