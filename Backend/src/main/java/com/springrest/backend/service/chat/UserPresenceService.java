package com.springrest.backend.service.chat;

import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserPresenceService {
    private final StringRedisTemplate redisTemplate;

    //key save alll online user
    private static final String ONLINE_USERS_KEY = "online_users";

    //prefix key save list of user's sessionId
    private static final String USER_SESSIONS_PREFIX = "user:sessions:";

    //if user have just turn on : state off -> on
    public boolean userConnected(Integer userId, String sessionId) {
        String userSessionKey = USER_SESSIONS_PREFIX + userId;

        //add sessionId into set of user with currentId
        redisTemplate.opsForSet().add(userSessionKey, sessionId);

        //add current id into online list user
        redisTemplate.opsForSet().add(ONLINE_USERS_KEY, String.valueOf(userId));

        Long countSession = redisTemplate.opsForSet().size(userSessionKey);

        return countSession != null && countSession == 1L;
    }

    //user shutdown all tabs
    public boolean userDisconnected(Integer userId,  String sessionId) {
        String userSessionKey = USER_SESSIONS_PREFIX + userId;
        //remove session from list
        redisTemplate.opsForSet().remove(userSessionKey, sessionId);

        Long countSession = redisTemplate.opsForSet().size(userSessionKey);

        if(countSession == null || countSession == 0L) {
            redisTemplate.delete(userSessionKey);
            redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, String.valueOf(userId));
            return true;
        }
        return false;
    }

    //get online list of peolple
    public Set<Integer> getOnlineUserIds() {
        Set<String> members = redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
        if (members == null || members.isEmpty()) {
            return Collections.emptySet();
        }
        return members.stream()
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }

    //check if user is online
    public boolean isUserOnline(Integer userId) {
        return Boolean.TRUE.equals(
                redisTemplate.opsForSet().isMember(ONLINE_USERS_KEY, String.valueOf(userId))
        );
    }
}
