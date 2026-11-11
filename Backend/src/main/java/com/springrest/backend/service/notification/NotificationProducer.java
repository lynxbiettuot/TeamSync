package com.springrest.backend.service.notification;

import com.springrest.backend.config.RabbitMQConfig;
import com.springrest.backend.dto.notification.NotificationEvent;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationProducer {// push the notification into rabbitmq
    private final RabbitTemplate rabbitTemplate;

    public void sendNotificationEvent(NotificationEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.ROUTING_KEY,
                event
        );
    }
}
