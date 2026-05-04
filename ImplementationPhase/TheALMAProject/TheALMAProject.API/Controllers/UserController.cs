using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.UserDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            var result = await _userService.GetByEmail(email);

            if (result == null)
            {
                return NotFound($"{email} not found!");
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagiantion([FromBody] UserQuery query)
        {
            var result = await _userService.GetUsers(query);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateUserDto dto)  
        {
            await _userService.CreateUser(dto);

            return Ok(new
            {
                message = $"Create {dto.Email} successfully!"
            });
        }

        [HttpDelete("{email}")]
        public async Task<IActionResult> DeleteAsync(string email)
        {
            await _userService.DeleteUser(email);

            return Ok(new
            {
                message = $"Delete {email} successfully!"
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateUserDto dto)
        {
            await _userService.UpdateUser(id, dto);

            return Ok(new
            {
                message = $"Update {dto.Email} successfully!"
            });
        }
    }
}
