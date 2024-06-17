var agent_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#agent-tbl')) {
        $('#agent-tbl').DataTable().destroy();
    }

    var dataTable = $('#agent-tbl').DataTable({
        columnDefs: [
            {
              createdCell: function(cell, cellData, rowData, rowIndex, colIndex) {
                  $(cell).addClass('text-center');
              }
            }
        ]
    });

    function reloadData() {
      $.ajax({
        url: '/agent_data', // Endpoint to fetch data
        method: 'GET',
        success: function(data) {
          dataTable.clear();
          data.forEach(function(row) {

            var status = '';
            if (row.active.data == 1) {
                status = '<span class="badge bg-info">ACTIVE</span>';
            } else {
                status = '<span class="badge bg-danger">INACTIVE</span>';
            }

            var btn = `<div class="btn-group">
            <button type="button" onclick="edit_agent(${row.agent_id}, ${row.agency_id}, '${row.AGENT_CODE}', '${row.FIRSTNAME}', '${row.MIDDLENAME}', '${row.LASTNAME}', '${row.CONTACTNo}')" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_agent(${row.agent_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

            dataTable.row.add([`${row.agency_name}`, row.AGENT_CODE, `${row.FIRSTNAME} ${row.MIDDLENAME} ${row.LASTNAME}`, row.CONTACTNo,status,btn]).draw();
          });
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#add_new_agent').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();

        $.ajax({
          url: '/add_agent',
          type: 'POST',
          data: formData,
          // processData: false, 
          // contentType: false,
          success: function(response) {
              reloadData();
              $('#modal-new-agent').modal('hide');
          },
          error: function(xhr, status, error) {
            var errorMessage = xhr.responseJSON.error;
            // if(errorMessage == 'password') {
            //   Swal.fire({
            //     icon: "error",
            //     title: "Oops...",
            //     text: "Password not match!",
            //   });
            // } else {
              console.error('Error updating user role:', error);
            // }
          }
       });
      // }
  });

  
    $('#edit_agent').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/agent/' + agent_id,
          type: 'PUT',
          data: formData,
          success: function(response) {
              reloadData();
              $('#modal-edit-agent').modal('hide');
          },
          error: function(error) {
              console.error('Error updating agent:', error);
          }
      });
  });

});

function addAgent() {
  $('#modal-new-agent').modal('show');
  get_agency();
}


function edit_agent(id, agency_id, agent_code, firstname, middlename, lastname, contact) {
  $('#modal-edit-agent').modal('show');
  $('#agent_code').val(agent_code);
  $('#firstname').val(firstname);
  $('#middlename').val(middlename);
  $('#lastname').val(lastname);
  $('#contact').val(contact);

  edit_get_agency(agency_id)
  agent_id = id;
}

function archive_agent(id){
  Swal.fire({
    title: 'Are you sure you want to delete this?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes'
}).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: '/agent/remove/' + id,
        type: 'PUT',
        success: function(response) {
          window.location.reload();
        },
        error: function(error) {
            console.error('Error deleting user role:', error);
        }
    });
    }
})
}

function get_agency() {
  $.ajax({
      url: '/agency_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('#agency');
          selectOptions.empty(); 
          response.forEach(function(option) {
              selectOptions.append($('<option>', {
                  value: option.IDNo+'-'+option.CODE,
                  text: option.AGENCY
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}

function edit_get_agency(id) {
  $.ajax({
      url: '/agency_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('.edit_agency');
          selectOptions.empty(); 
          response.forEach(function(option) {
            var selected = false;
            if(option.IDNo == id) {
              selected = true;
            }
            selectOptions.append($('<option>', {
              selected: selected,
              value: option.IDNo+'-'+option.CODE,
              text: option.AGENCY
            }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}