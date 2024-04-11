var account_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#account-tbl')) {
        $('#account-tbl').DataTable().destroy();
    }

    var dataTable = $('#account-tbl').DataTable({
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
        url: '/account_data', // Endpoint to fetch data
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
            <button type="button" onclick="edit_account(${row.account_id}, ${row.AGENT_ID}, '${row.agent_name}', '${row.agency_name}', ${row.GUESTNo},'${row.account_firstname}','${row.account_middlename}','${row.account_lastname}', '${row.MEMBERSHIPNo}' )" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_account(${row.account_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

            dataTable.row.add([`${row.agency_code}-${row.agent_code}-${row.GUESTNo}`,`${row.agency_name} (${row.agency_code})`, row.agent_code, `${row.account_firstname} ${row.account_middlename} ${row.account_lastname} `, row.MEMBERSHIPNo,status,btn]).draw();
          });
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#add_new_account').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();

        $.ajax({
          url: '/add_account',
          type: 'POST',
          data: formData,
          // processData: false, 
          // contentType: false,
          success: function(response) {
              reloadData();
              $('#modal-new-account').modal('hide');
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

  
    $('#edit_account').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/account/' + account_id,
          type: 'PUT',
          data: formData,
          success: function(response) {
              reloadData();
              $('#modal-edit-account').modal('hide');
          },
          error: function(error) {
              console.error('Error updating user role:', error);
          }
      });
  });

});

function addAccount() {
  $('#modal-new-account').modal('show');
  get_agent();
}



function edit_account(id, agent_id, agent_name, agency_name, guest_no, firstname,middlename,lastname,membership_no ) {
  $('#modal-edit-account').modal('show');
  $('#edit_agent_name').val(agent_name);
  $('#edit_agency_name').val(agency_name);
  $('#guest_no').val(guest_no);
  $('#firstname').val(firstname);
  $('#middlename').val(middlename);
  $('#lastname').val(lastname);
  $('#membership_no').val(membership_no);

  edit_get_agent(agent_id);
  account_id = id;
}

function archive_account(id){
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
        url: '/account/remove/' + id,
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

function get_agent() {
  $.ajax({
      url: '/agent_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('#agent_id');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
            value: '',
            text: '--SELECT AGENT--'
        }));
          response.forEach(function(option) {
              selectOptions.append($('<option>', {
                  value: option.agent_id,
                  text: option.agency_code+'-'+option.agent_code
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}

function edit_get_agent(id) {
  $.ajax({
      url: '/agent_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('.agent_id');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
              selected: false,
              value: '',
              text: '--SELECT AGENT--'
          }));
          response.forEach(function(option) {
              var selected = false;
              if(option.agent_id == id) {
                selected = true;
              }
              selectOptions.append($('<option>', {
                selected: selected,
                value: option.agent_id,
                text: option.agency_code+'-'+option.agent_code
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}

$('#agent_id').on('change', function(){
  var agent = $(this).val().split();

  get_agent_name(agent[0]);
});

$('.agent_id').on('change', function(){
  var agent = $(this).val();

  edit_get_agent_name(agent);
})

function get_agent_name(id) {
  $.ajax({
      url: '/agent_data/'+id,
      method: 'GET',
      success: function(response) {
          $('#agent_name').val(response[0].agent_name);
          $('#agency_name').val(response[0].agency);
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}

function edit_get_agent_name(id) {
  $.ajax({
      url: '/agent_data/'+id,
      method: 'GET',
      success: function(response) {
          $('#edit_agent_name').val(response[0].agent_name);
          $('#edit_agency_name').val(response[0].agency);
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}
