var cage_category_id;

$(document).ready(function () {
    if ($.fn.DataTable.isDataTable('#cage-category-tbl')) {
        $('#cage-category-tbl').DataTable().destroy();
    }

    var dataTable = $('#cage-category-tbl').dataTable({
        columnDefs: [
            {
                createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
                    $(cell).addClass('text-center');
                }
            }
        ]
    });

    function reloadData() {
        $.ajax({
            url: '/cage_category_data',
            method: 'GET',
            success: function (data) {
                dataTable.clear();
                data.forEach(function (row) {
                    var status = '';
                    if (row.ACTIVE.data[0] == 1) {
                        status = '<span class="badge bg-info">ACTIVE</span>';
                    } else {
                        status = '<span class="badge bg-danger">INACTIVE</span>';
                    }
                    var btn = `<div class="btn-group">
                        <button type="button"  class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
                        data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
                        <i class="fa fa-pencil-alt"></i>
                        </button>
                        <button type="button"  class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
                        data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
                        <i class="fa fa-trash-alt"></i>
                        </button>
                    </div>`;

                    dataTable.row.add([row.CATEGORY]).draw();
                });
            },
            error: function (xhr, status, error) {
                console.error('Error fetching data:', error);
            }
        });
    }

    reloadData();
});


function addCageCategory() {
    $('#modal-new-cage-category').modal('show');
}
