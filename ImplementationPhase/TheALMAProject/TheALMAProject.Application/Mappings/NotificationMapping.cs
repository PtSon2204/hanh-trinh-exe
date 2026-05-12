using AutoMapper;
using TheALMAProject.Application.DTOs.NotificationDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class NotificationMapping : Profile
    {
        public NotificationMapping()
        {
            CreateMap<Notification, NotificationResponseDto>();
            CreateMap<CreateNotificationDto, Notification>();
        }
    }
}
