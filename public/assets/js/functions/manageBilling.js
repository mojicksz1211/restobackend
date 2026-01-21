// ============================================
// BILLING MANAGEMENT SCRIPT
// ============================================
// File: public/assets/js/functions/manageBilling.js
// Description: Loads billing records into DataTable with statuses
// ============================================

// Load translations from data attributes
var billingTranslations = {};
var paymentStatusLabels = {
	1: { text: 'Paid', className: 'bg-success' },
	2: { text: 'Partial', className: 'bg-warning' },
	3: { text: 'Unpaid', className: 'bg-danger' }
};

let billingDataTable;
let showBranchColumn = false;

function getBillingContext() {
	const el = document.getElementById('billingContextData');
	if (!el) {
		return { permissions: 0, branchId: null };
	}
	const permissions = parseInt(el.getAttribute('data-permissions') || '0');
	const branchId = el.getAttribute('data-branch-id') || null;
	return { permissions, branchId };
}

function adminNeedsBranchSelection() {
	const ctx = getBillingContext();
	return ctx.permissions === 1 && !ctx.branchId;
}

$(document).ready(function () {
	// Load translations from data attributes
	var $transEl = $('#billingTranslations');
	if ($transEl.length) {
		billingTranslations = {
			paid: $transEl.data('paid') || 'Paid',
			partial: $transEl.data('partial') || 'Partial',
			unpaid: $transEl.data('unpaid') || 'Unpaid',
			settled: $transEl.data('settled') || 'Settled',
			view: $transEl.data('view') || 'View',
			pay: $transEl.data('pay') || 'Pay',
			loading: $transEl.data('loading') || 'Loading...',
			no_payments_found: $transEl.data('no-payments-found') || 'No payments found',
			failed_to_load_payments: $transEl.data('failed-to-load-payments') || 'Failed to load payments',
			success: $transEl.data('success') || 'Success',
			payment_processed_successfully: $transEl.data('payment-processed-successfully') || 'Payment processed successfully',
			error: $transEl.data('error') || 'Error',
			failed_to_process_payment: $transEl.data('failed-to-process-payment') || 'Failed to process payment',
			unable_to_load_billing_records: $transEl.data('unable-to-load-billing-records') || 'Unable to load billing records. Please refresh.',
			unknown: $transEl.data('unknown') || 'Unknown',
			n_a: $transEl.data('n-a') || 'N/A',
			pagination: {
				showing: $transEl.data('pagination-showing') || 'Showing',
				to: $transEl.data('pagination-to') || 'to',
				of: $transEl.data('pagination-of') || 'of',
				entries: $transEl.data('pagination-entries') || 'entries',
				previous: $transEl.data('pagination-previous') || 'Previous',
				next: $transEl.data('pagination-next') || 'Next',
				search: $transEl.data('pagination-search') || 'Search',
				search_placeholder: $transEl.data('pagination-search-placeholder') || 'Search...'
			}
		};
		
		// Update payment status labels
		paymentStatusLabels = {
			1: { text: billingTranslations.paid, className: 'bg-success' },
			2: { text: billingTranslations.partial, className: 'bg-warning' },
			3: { text: billingTranslations.unpaid, className: 'bg-danger' }
		};
	}

	if ($.fn.DataTable.isDataTable('#billingTable')) {
		$('#billingTable').DataTable().destroy();
	}

	showBranchColumn = adminNeedsBranchSelection();
	// Safety: if header already has Branch column, honor it even if context missing
	const headerCount = $('#billingTable thead th').length;
	if (headerCount >= 11) {
		showBranchColumn = true;
	}

	// Get pagination translations
	const paginationTrans = billingTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const searchText = paginationTrans.search || 'Search';
	
	const statusIdx = showBranchColumn ? 6 : 5;
	const dateIdx = showBranchColumn ? 7 : 6;
	const paymentsIdx = showBranchColumn ? 9 : 8;
	const actionsIdx = showBranchColumn ? 10 : 9;

	billingDataTable = $('#billingTable').DataTable({
		order: [[dateIdx, 'desc']],
		columnDefs: [
			{ targets: [statusIdx, dateIdx, paymentsIdx, actionsIdx], className: 'text-center' },
			{ targets: [paymentsIdx, actionsIdx], orderable: false }
		],
		pageLength: 10,
		language: {
			lengthMenu: showingText + " _MENU_ " + entriesText,
			info: showingText + " _START_ " + toText + " _END_ " + ofText + " _TOTAL_ " + entriesText,
			infoEmpty: showingText + " 0 " + toText + " 0 " + ofText + " 0 " + entriesText,
			infoFiltered: "(" + searchText + " " + ofText + " _MAX_ " + entriesText + ")",
			search: searchText + ":",
			searchPlaceholder: paginationTrans.search_placeholder || "Search...",
			paginate: {
				previous: paginationTrans.previous || 'Previous',
				next: paginationTrans.next || 'Next'
			}
		}
	});

	loadBillingData();

	// Payment form submit
	$('#payment_form').submit(function (event) {
		event.preventDefault();
		if (adminNeedsBranchSelection()) {
			Swal.fire({
				icon: 'warning',
				title: 'Select a branch',
				text: 'Please select a specific branch in the top bar before processing payment.'
			});
			return;
		}
		const orderId = $('#payment_order_id').val();
		const payload = {
			payment_method: $('#payment_method').val(),
			amount_paid: $('#amount_paid').val(),
			payment_ref: $('#payment_ref').val()
		};

		$.ajax({
			url: `/billing/${orderId}`,
			method: 'PUT',
			data: payload,
			success: function () {
				$('#modal-payment').modal('hide');
				Swal.fire({ 
					icon: 'success', 
					title: billingTranslations.success || 'Success', 
					text: billingTranslations.payment_processed_successfully || 'Payment processed successfully' 
				});
				loadBillingData();
			},
			error: function (xhr) {
				console.error('Error updating billing:', xhr.responseText);
				Swal.fire({ 
					icon: 'error', 
					title: billingTranslations.error || 'Error', 
					text: billingTranslations.failed_to_process_payment || 'Failed to process payment' 
				});
			}
		});
	});

	// Reset readonly state when modal closes
	$('#modal-payment').on('hidden.bs.modal', function () {
		$('#amount_paid').prop('readonly', false);
	});
});

function loadBillingData() {
	$.ajax({
		url: '/billing/data',
		method: 'GET',
		dataType: 'json',
		success: function (data) {
			billingDataTable.clear();
			data.forEach(function (row) {
				const paymentsBtn = `
					<button class="btn btn-sm btn-outline-secondary" onclick="openPaymentHistoryModal(${row.ORDER_ID}, '${row.ORDER_NO}')">
						<i class="fa fa-list"></i> ${billingTranslations.view || 'View'}
					</button>
				`;

				const actions = parseInt(row.STATUS) === 1
					? `<button class="btn btn-sm btn-success" disabled><i class="fa fa-check"></i> ${billingTranslations.settled || 'Settled'}</button>`
					: `
						<button class="btn btn-sm btn-primary" onclick="openPaymentModal(${row.ORDER_ID}, '${row.ORDER_NO}', ${row.AMOUNT_DUE}, ${row.AMOUNT_PAID}, '${row.PAYMENT_METHOD}', ${row.STATUS}, '${row.PAYMENT_REF || ''}')">
							<i class="fa fa-cash-register"></i> ${billingTranslations.pay || 'Pay'}
						</button>
					`;

			const n_a = billingTranslations.n_a || 'N/A';
			const branchLabel = row.BRANCH_NAME || row.BRANCH_LABEL || n_a;
			const baseRow = [
				row.ORDER_NO || n_a,
				showBranchColumn ? branchLabel : null,
				row.PAYMENT_METHOD || n_a,
				formatCurrency(row.AMOUNT_DUE),
				formatCurrency(row.AMOUNT_PAID),
				row.PAYMENT_REF || '-',
				formatBillingStatus(row.STATUS),
				formatDate(row.ENCODED_DT),
				row.ENCODED_BY || '-',
				paymentsBtn,
				actions
			];
			const rowData = showBranchColumn ? baseRow : baseRow.filter((_, idx) => idx !== 1);
			billingDataTable.row.add(rowData);
			});

			billingDataTable.draw();
		},
		error: function (xhr, status, error) {
			console.error('Failed to load billing records:', error);
			Swal.fire({
				icon: 'error',
				title: billingTranslations.error || 'Error!',
				text: billingTranslations.unable_to_load_billing_records || 'Unable to load billing records. Please refresh.'
			});
		}
	});
}

function formatBillingStatus(status) {
	const label = paymentStatusLabels[parseInt(status)];
	if (!label) {
		return `<span class="badge bg-secondary">${billingTranslations.unknown || 'Unknown'}</span>`;
	}
	return `<span class="badge ${label.className}">${label.text}</span>`;
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
		return billingTranslations.n_a || 'N/A';
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

function openPaymentModal(orderId, orderNo, amountDue, amountPaid, method, status, ref) {
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before opening payment.'
		});
		return;
	}
	$('#payment_order_id').val(orderId);
	$('#payment_order_no').text(orderNo);
	$('#display_amount_due').text(formatCurrency(amountDue));
	
	const balance = parseFloat(amountDue) - parseFloat(amountPaid);
	$('#display_balance').text(formatCurrency(balance));
	
	$('#payment_method').val(method || 'CASH');
	$('#amount_paid').val(balance.toFixed(2)); // Auto-fill with balance amount
	$('#amount_paid').prop('readonly', true); // Make it read-only since it's automatic
	$('#payment_ref').val('');
	
	$('#modal-payment').modal('show');
}

function openPaymentHistoryModal(orderId, orderNo) {
	if (adminNeedsBranchSelection()) {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text: 'Please select a specific branch in the top bar before viewing payments.'
		});
		return;
	}
	$('#payment_history_order_no').text(orderNo || '');
	const $tbody = $('#paymentHistoryTable tbody');
	$tbody.html(`<tr><td colspan="5" class="text-center text-muted">${billingTranslations.loading || 'Loading...'}</td></tr>`);

	$.ajax({
		url: `/billing/${orderId}/payments`,
		method: 'GET',
		dataType: 'json',
		success: function (rows) {
			if (!rows || rows.length === 0) {
				$tbody.html(`<tr><td colspan="5" class="text-center text-muted">${billingTranslations.no_payments_found || 'No payments found'}</td></tr>`);
				return;
			}

			const html = rows.map(function (r) {
				return `
					<tr>
						<td>${formatDate(r.ENCODED_DT)}</td>
						<td>${r.PAYMENT_METHOD || '-'}</td>
						<td>${formatCurrency(r.AMOUNT_PAID)}</td>
						<td>${r.PAYMENT_REF || '-'}</td>
						<td>${r.ENCODED_BY || '-'}</td>
					</tr>
				`;
			}).join('');
			$tbody.html(html);
		},
		error: function (xhr) {
			console.error('Failed to load payment history:', xhr.responseText);
			$tbody.html(`<tr><td colspan="5" class="text-center text-danger">${billingTranslations.failed_to_load_payments || 'Failed to load payments'}</td></tr>`);
		}
	});

	$('#modal-payment-history').modal('show');
}
