package com.springrest.backend.repository;

import com.springrest.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {// query on notification table
   //find all notification
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);

    //query all notification is not read
    @Query(value="SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false")
    long countUnreadByUserId(@Param("userId") Integer userId);

    //mark all user's notification is read
    @Modifying
    @Query(value="UPDATE Notification n SET n.isRead = true, n.updatedAt = CURRENT_TIMESTAMP WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Integer userId);


}
