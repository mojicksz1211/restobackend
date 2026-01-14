// ============================================
// BILLING MANAGEMENT SCRIPT
// ============================================
// File: public/assets/js/functions/manageBilling.js
// Description: Loads billing records into DataTable with statuses
// ============================================

const paymentStatusLabels = {
	1: { text: 'Paid', className: 'bg-success' },
	2: { text: 'Partial', className: 'bg-warning' },
	3: { text: 'Unpaid', className: 'bg-danger' }
};

let billingDataTable;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#billingTable')) {
		$('#billingTable').DataTable().destroy();
	}

	billingDataTable = $('#billingTable').DataTable({
		order: [[6, 'desc']],
		columnDefs: [
			{ targets: [5, 6, 8, 9], className: 'text-center' },
			{ targets: [8, 9], orderable: false }
		]
	});

	loadBillingData();

	// Payment form submit
	$('#payment_form').submit(function (event) {
		event.preventDefault();
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
				Swal.fire({ icon: 'success', title: 'Success', text: 'Payment processed successfully' });
				loadBillingData();
			},
			error: function (xhr) {
				console.error('Error updating billing:', xhr.responseText);
				Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to process payment' });
			}
		});
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
						<i class="fa fa-list"></i> View
					</button>
				`;

				const actions = parseInt(row.STATUS) === 1
					? `<button class="btn btn-sm btn-success" disabled><i class="fa fa-check"></i> Settled</button>`
					: `
						<button class="btn btn-sm btn-primary" onclick="openPaymentModal(${row.ORDER_ID}, '${row.ORDER_NO}', ${row.AMOUNT_DUE}, ${row.AMOUNT_PAID}, '${row.PAYMENT_METHOD}', ${row.STATUS}, '${row.PAYMENT_REF || ''}')">
							<i class="fa fa-cash-register"></i> Pay
						</button>
					`;

				billingDataTable.row.add([
					row.ORDER_NO || 'N/A',
					row.PAYMENT_METHOD || 'N/A',
					formatCurrency(row.AMOUNT_DUE),
					formatCurrency(row.AMOUNT_PAID),
					row.PAYMENT_REF || '-',
					formatBillingStatus(row.STATUS),
					formatDate(row.ENCODED_DT),
					row.ENCODED_BY || '-',
					paymentsBtn,
					actions
				]);
			});

			billingDataTable.draw();
		},
		error: function (xhr, status, error) {
			console.error('Failed to load billing records:', error);
			Swal.fire({
				icon: 'error',
				title: 'Error!',
				text: 'Unable to load billing records. Please refresh.'
			});
		}
	});
}

function formatBillingStatus(status) {
	const label = paymentStatusLabels[parseInt(status)];
	if (!label) {
		return '<span class="badge bg-secondary">Unknown</span>';
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

function openPaymentModal(orderId, orderNo, amountDue, amountPaid, method, status, ref) {
	$('#payment_order_id').val(orderId);
	$('#payment_order_no').text(orderNo);
	$('#display_amount_due').text(formatCurrency(amountDue));
	
	const balance = parseFloat(amountDue) - parseFloat(amountPaid);
	$('#display_balance').text(formatCurrency(balance));
	
	$('#payment_method').val(method || 'CASH');
	$('#amount_paid').val(''); // I-reset para input ng bayad NGAYON
	$('#payment_ref').val('');
	
	$('#modal-payment').modal('show');
}

function openPaymentHistoryModal(orderId, orderNo) {
	$('#payment_history_order_no').text(orderNo || '');
	const $tbody = $('#paymentHistoryTable tbody');
	$tbody.html('<tr><td colspan="5" class="text-center text-muted">Loading...</td></tr>');

	$.ajax({
		url: `/billing/${orderId}/payments`,
		method: 'GET',
		dataType: 'json',
		success: function (rows) {
			if (!rows || rows.length === 0) {
				$tbody.html('<tr><td colspan="5" class="text-center text-muted">No payments found</td></tr>');
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
			$tbody.html('<tr><td colspan="5" class="text-center text-danger">Failed to load payments</td></tr>');
		}
	});

	$('#modal-payment-history').modal('show');
}
