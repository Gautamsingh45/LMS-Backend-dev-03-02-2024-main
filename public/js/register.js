$(document).ready(function() {
    $('#username').on('input', function() {
        var username = $(this).val();
        if (username === '') {
            $('#username-error').text('');
            return; // Exit the function if the username is empty
        }
        $.ajax({
            type: 'GET',
            url: '/check-username/' + username,
            success: function(data) {
                $('#username-error').text(data);
                if (data === 'Username is available') {
                    $('#username-error').text('');
                    $('#register-btn').prop('disabled', false);
                } else {
                    $('#register-btn').prop('disabled', true);
                }
            },
            error: function(xhr, status, error) {
                console.error(error);
            }
        });
    });
});

$(document).ready(function() {
    $('#password').on('input', function() {
        var password = $(this).val();
        if (password === '') {
            $('#password-error').text('');
            return; // Exit the function if the password is empty
        }
        // Regex to check for at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character
        var strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
        if (strongPasswordRegex.test(password)) {
            $('#password-error').text('');
            $('#register-btn').prop('disabled', false);
        } else {
            $('#password-error').text('Password must be at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.').css({'color': 'red', 'font-weight': 'bold'});
            
            $('#register-btn').prop('disabled', true);
        }
    });
});



$(document).ready(function() {
    $('#email').on('input', function() {
        var email = $(this).val();
        if (email === '') {
            $('#email-error').text('');
            return; // Exit the function if the email is empty
        }
        $.ajax({
            type: 'GET',
            url: '/check-email/' + email,
            success: function(data) {
                // Handle the response based on the data received
                if (data === 'Email is available' || data === 'Email is registered but not verified') {
                    $('#email-error').text('');
                    $('#register-btn').prop('disabled', false);
                } else if (data === 'Email is registered and verified') {
                    $('#email-error').text('This email Id is already registered and verified  .').css({'color': '#ffcc00'});
                    $('#register-btn').prop('disabled', true);
                } else {
                    // Handle unexpected response
                    console.error('Unexpected response from server:', data);
                    // Optionally, display an error message or take other actions
                }
            },
            error: function(xhr, status, error) {
                console.error('Error checking email:', error);
                // Optionally, display an error message or take other actions
            }
        });
    });
});



